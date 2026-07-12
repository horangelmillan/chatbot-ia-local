const express = require("express");
const router = express.Router();
const { buildDocumentRepository, buildDocumentIndexer } = require("../src/features/documents/composition/documentsContainer");
const pool = require("../db/pool");

const documentRepository = buildDocumentRepository();
const documentIndexer = buildDocumentIndexer();

router.post("/index", async (req, res) => {
  const { path: filePath, directory } = req.body;
  try {
    let result;
    if (directory) {
      result = await documentIndexer.indexDirectory(directory);
    } else if (filePath) {
      result = await documentIndexer.indexDocument(filePath);
    } else {
      return res.status(400).json({ error: "Provide 'path' or 'directory'" });
    }
    res.json({ ok: true, result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/search", async (req, res) => {
  const q = req.query.q;
  const category = req.query.category;
  if (!q) return res.status(400).json({ error: "Query param 'q' required" });
  const keywords = q.split(/\s+/);
  const result = await documentRepository.search(category, keywords);
  if (!result) return res.json({ found: false });
  res.json({ found: true, type: result.type, data: result.data });
});

router.get("/faq/search", async (req, res) => {
  const q = req.query.q;
  const category = req.query.category;
  if (!q) return res.status(400).json({ error: "Query param 'q' required" });
  const keywords = q.split(/\s+/);
  const result = await documentRepository.searchFAQ(category, keywords);
  if (!result) return res.json({ found: false });
  res.json({ found: true, data: result });
});

router.get("/:id", async (req, res) => {
  const numericId = parseInt(req.params.id, 10);
  const result = await pool.query(
    "SELECT * FROM documents WHERE id = $1 OR code = $2",
    [isNaN(numericId) ? -1 : numericId, req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
  const chunks = await pool.query("SELECT * FROM document_chunks WHERE document_id = $1 ORDER BY chunk_number", [result.rows[0].id]);
  res.json({ document: result.rows[0], chunks: chunks.rows });
});

module.exports = router;
