const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const pool = require("../../../../../shared/adapters/outbound/postgres/pool");

var parsers = {};

parsers["md"] = async function (filePath) {
  return fs.readFileSync(filePath, "utf-8");
};

parsers["txt"] = parsers["md"];

parsers["json"] = async function (filePath) {
  var raw = fs.readFileSync(filePath, "utf-8");
  var parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) {
    return parsed.map(function (item) { return JSON.stringify(item); }).join("\n\n");
  }
  return raw;
};

function parseFrontmatter(text) {
  var meta = {};
  var body = text;
  if (text.startsWith("---")) {
    var end = text.indexOf("---", 3);
    if (end > 0) {
      var front = text.slice(3, end).trim();
      front.split("\n").forEach(function (line) {
        var m = line.match(/^(\w+):\s*(.+)/);
        if (m) {
          var val = m[2].trim();
          if (val.startsWith("[") && val.endsWith("]")) {
            val = val.slice(1, -1).split(",").map(function (s) { return s.trim().replace(/^['"]|['"]$/g, ""); });
          }
          meta[m[1].toLowerCase()] = val;
        }
      });
      body = text.slice(end + 3).trim();
    }
  }
  return { meta: meta, body: body };
}

function splitChunks(text, maxWords) {
  maxWords = maxWords || 800;
  var lines = text.split("\n");
  var chunks = [];
  var current = { title: "", lines: [], words: 0 };
  var lastTitle = "";
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var isHeading = /^#{1,4}\s/.test(line) || /^[A-Z][^a-z]+$/.test(line.trim());
    if (isHeading || current.words >= maxWords) {
      if (current.lines.length > 0) {
        chunks.push({ title: current.title, content: current.lines.join("\n").trim() });
        current = { title: "", lines: [], words: 0 };
      }
    }
    if (isHeading) {
      current.title = line.replace(/^#+\s*/, "").trim();
    }
    current.lines.push(line);
    current.words += line.split(/\s+/).length;
  }
  if (current.lines.length > 0) {
    chunks.push({ title: current.title, content: current.lines.join("\n").trim() });
  }
  return chunks;
}

function estimateTokens(text) {
  return Math.ceil(text.split(/\s+/).length * 1.3);
}

async function indexDocument(filePath) {
  var ext = path.extname(filePath).toLowerCase().replace(".", "");
  var parser = parsers[ext];
  if (!parser) throw new Error("Unsupported format: " + ext);
  var text = await parser(filePath);
  var fm = parseFrontmatter(text);
  var fileName = path.basename(filePath);
  var code = fm.meta.code || path.basename(filePath, path.extname(filePath));
  var checksum = crypto.createHash("sha256").update(text).digest("hex");

  var existing = await pool.query("SELECT id FROM documents WHERE code = $1", [code]);
  if (existing.rows.length > 0) {
    await pool.query("DELETE FROM document_chunks WHERE document_id = $1", [existing.rows[0].id]);
    await pool.query("DELETE FROM documents WHERE id = $1", [existing.rows[0].id]);
  }

  var docResult = await pool.query(
    "INSERT INTO documents (code, title, category, file_name, file_path, version, checksum) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id",
    [code, fm.meta.title || fileName, fm.meta.category || "general", fileName, filePath, fm.meta.version || "1.0", checksum]
  );
  var docId = docResult.rows[0].id;

  var body = fm.body || text;
  var chunks = splitChunks(body);
  for (var i = 0; i < chunks.length; i++) {
    var chunk = chunks[i];
    var tokens = estimateTokens(chunk.content);
    await pool.query(
      "INSERT INTO document_chunks (document_id, chunk_number, title, content, token_count) VALUES ($1,$2,$3,$4,$5)",
      [docId, i + 1, chunk.title, chunk.content, tokens]
    );
  }

  if (fm.meta.keywords && fm.meta.question && fm.meta.answer) {
    await pool.query(
      "INSERT INTO faq (code, question, answer, category, keywords, version) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (code) DO UPDATE SET question=$2, answer=$3, category=$4, keywords=$5, version=$6",
      [code, fm.meta.question, fm.meta.answer, fm.meta.category, fm.meta.keywords, fm.meta.version || "1.0"]
    );
  }

  return { code: code, chunks: chunks.length, id: docId };
}

async function indexDirectory(dirPath) {
  var results = [];
  var files = fs.readdirSync(dirPath, { recursive: true });
  var supported = Object.keys(parsers);
  for (var i = 0; i < files.length; i++) {
    var ext = path.extname(files[i]).toLowerCase().replace(".", "");
    if (supported.indexOf(ext) >= 0) {
      try {
        var r = await indexDocument(path.join(dirPath, files[i]));
        results.push(r);
      } catch (e) {
        console.error("Index error:", files[i], e.message);
      }
    }
  }
  return results;
}

module.exports = { indexDocument, indexDirectory };
