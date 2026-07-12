const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const pool = require("../../../../../shared/adapters/outbound/postgres/pool");

const parsers = {};

parsers.md = async (filePath) => fs.readFileSync(filePath, "utf-8");

parsers.txt = parsers.md;

parsers.json = async (filePath) => {
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) {
    return parsed.map((item) => JSON.stringify(item)).join("\n\n");
  }
  return raw;
};

const parseFrontmatter = (text) => {
  const meta = {};
  let body = text;
  if (text.startsWith("---")) {
    const end = text.indexOf("---", 3);
    if (end > 0) {
      const front = text.slice(3, end).trim();
      front.split("\n").forEach((line) => {
        const m = line.match(/^(\w+):\s*(.+)/);
        if (m) {
          let val = m[2].trim();
          if (val.startsWith("[") && val.endsWith("]")) {
            val = val.slice(1, -1).split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, ""));
          }
          meta[m[1].toLowerCase()] = val;
        }
      });
      body = text.slice(end + 3).trim();
    }
  }
  return { meta, body };
};

function splitChunks(text, maxWords = 800) {
  const lines = text.split("\n");
  const chunks = [];
  let current = { title: "", lines: [], words: 0 };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isHeading = /^#{1,4}\s/.test(line) || /^[A-Z][^a-z]+$/.test(line.trim());
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

const estimateTokens = (text) => Math.ceil(text.split(/\s+/).length * 1.3);

const indexDocument = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase().replace(".", "");
  const parser = parsers[ext];
  if (!parser) throw new Error(`Unsupported format: ${ext}`);
  const text = await parser(filePath);
  const fm = parseFrontmatter(text);
  const fileName = path.basename(filePath);
  const code = fm.meta.code || path.basename(filePath, path.extname(filePath));
  const checksum = crypto.createHash("sha256").update(text).digest("hex");

  const existing = await pool.query("SELECT id FROM documents WHERE code = $1", [code]);
  if (existing.rows.length > 0) {
    await pool.query("DELETE FROM document_chunks WHERE document_id = $1", [existing.rows[0].id]);
    await pool.query("DELETE FROM documents WHERE id = $1", [existing.rows[0].id]);
  }

  const docResult = await pool.query(
    "INSERT INTO documents (code, title, category, file_name, file_path, version, checksum) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id",
    [code, fm.meta.title || fileName, fm.meta.category || "general", fileName, filePath, fm.meta.version || "1.0", checksum]
  );
  const docId = docResult.rows[0].id;

  const body = fm.body || text;
  const chunks = splitChunks(body);
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const tokens = estimateTokens(chunk.content);
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

  return { code, chunks: chunks.length, id: docId };
};

const indexDirectory = async (dirPath) => {
  const results = [];
  const files = fs.readdirSync(dirPath, { recursive: true });
  const supported = Object.keys(parsers);
  for (let i = 0; i < files.length; i++) {
    const ext = path.extname(files[i]).toLowerCase().replace(".", "");
    if (supported.includes(ext)) {
      try {
        const r = await indexDocument(path.join(dirPath, files[i]));
        results.push(r);
      } catch (e) {
        console.error("Index error:", files[i], e.message);
      }
    }
  }
  return results;
};

module.exports = { indexDocument, indexDirectory };
