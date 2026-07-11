const express = require("express");
const router = express.Router();
const indexer = require("../db/indexer");
const engine = require("../db/engine");
const pool = require("../db/pool");

router.post("/index", async function (req, res) {
  var filePath = req.body.path;
  var directory = req.body.directory;
  try {
    var result;
    if (directory) {
      result = await indexer.indexDirectory(directory);
    } else if (filePath) {
      result = await indexer.indexDocument(filePath);
    } else {
      return res.status(400).json({ error: "Provide 'path' or 'directory'" });
    }
    res.json({ ok: true, result: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/search", async function (req, res) {
  var q = req.query.q;
  var category = req.query.category;
  if (!q) return res.status(400).json({ error: "Query param 'q' required" });
  var keywords = q.split(/\s+/);
  var result = await engine.search(category, keywords);
  if (!result) return res.json({ found: false });
  res.json({ found: true, type: result.type, data: result.data });
});

router.get("/faq/search", async function (req, res) {
  var q = req.query.q;
  var category = req.query.category;
  if (!q) return res.status(400).json({ error: "Query param 'q' required" });
  var keywords = q.split(/\s+/);
  var result = await engine.searchFAQ(category, keywords);
  if (!result) return res.json({ found: false });
  res.json({ found: true, data: result });
});

router.get("/:id", async function (req, res) {
  var result = await pool.query("SELECT * FROM documents WHERE id = $1 OR code = $1", [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
  var chunks = await pool.query("SELECT * FROM document_chunks WHERE document_id = $1 ORDER BY chunk_number", [result.rows[0].id]);
  res.json({ document: result.rows[0], chunks: chunks.rows });
});

module.exports = router;
