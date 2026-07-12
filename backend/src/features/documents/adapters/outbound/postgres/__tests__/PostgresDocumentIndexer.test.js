const fs = require("fs");
const path = require("path");
const pool = require("../../../../../../shared/adapters/outbound/postgres/pool");
const indexer = require("../PostgresDocumentIndexer");

beforeAll(async () => {
  await pool.query("TRUNCATE faq, document_chunks, documents CASCADE");
});

test("indexDocument indexa un archivo markdown", async () => {
  const tmpFile = path.resolve(__dirname, "__test_doc__.md");
  fs.writeFileSync(tmpFile, "# Test Doc\n\ncontenido de prueba para indexacion", "utf-8");
  try {
    const result = await indexer.indexDocument(tmpFile);
    expect(result).toHaveProperty("code");
    expect(result.chunks).toBeGreaterThan(0);
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
});

test("indexDocument indexa FAQ si tiene frontmatter con question y answer", async () => {
  const tmpFile = path.resolve(__dirname, "__test_faq__.md");
  const content = `---
code: FAQ-TEST
category: General
keywords: [test, faq]
question: Test question?
answer: Test answer.
---

# FAQ content`;
  fs.writeFileSync(tmpFile, content, "utf-8");
  try {
    const result = await indexer.indexDocument(tmpFile);
    expect(result.code).toBe("FAQ-TEST");
    const faq = await pool.query("SELECT * FROM faq WHERE code = $1", ["FAQ-TEST"]);
    expect(faq.rows.length).toBe(1);
    expect(faq.rows[0].question).toBe("Test question?");
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
});

test("indexDocument actualiza documento existente (reemplaza)", async () => {
  const tmpFile = path.resolve(__dirname, "__test_update__.md");
  fs.writeFileSync(tmpFile, "# Version 1\n\ncontenido original", "utf-8");
  try {
    const r1 = await indexer.indexDocument(tmpFile);
    fs.writeFileSync(tmpFile, "# Version 2\n\ncontenido actualizado", "utf-8");
    const r2 = await indexer.indexDocument(tmpFile);
    expect(r2.code).toBe(r1.code);
    const docs = await pool.query("SELECT * FROM documents WHERE code = $1", [r1.code]);
    expect(docs.rows.length).toBe(1);
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
});

test("indexDocument lanza error para formato no soportado", async () => {
  const tmpFile = path.resolve(__dirname, "__test_bad__.xyz");
  fs.writeFileSync(tmpFile, "some content", "utf-8");
  try {
    await expect(indexer.indexDocument(tmpFile)).rejects.toThrow("Unsupported format");
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
});

test("indexDirectory indexa multiples archivos", async () => {
  const tmpDir = path.resolve(__dirname, "__test_dir__");
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.writeFileSync(path.join(tmpDir, "doc1.md"), "# Doc 1\n\ncontenido", "utf-8");
  fs.writeFileSync(path.join(tmpDir, "doc2.md"), "# Doc 2\n\ncontenido", "utf-8");
  try {
    const results = await indexer.indexDirectory(tmpDir);
    expect(results.length).toBe(2);
    const docs = await pool.query("SELECT * FROM documents WHERE code LIKE 'doc_'");
    expect(docs.rows.length).toBe(2);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
