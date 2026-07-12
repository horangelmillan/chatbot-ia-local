const express = require("express");
const request = require("supertest");

function buildTestApp(mockSearch, mockIndexDocument, mockIndexDirectory, mockPool) {
  const app = express();
  app.use(express.json());

  app.post("/api/documents/index", async (req, res) => {
    const { path: filePath, directory } = req.body;
    try {
      let result;
      if (directory) {
        result = await mockIndexDirectory(directory);
      } else if (filePath) {
        result = await mockIndexDocument(filePath);
      } else {
        return res.status(400).json({ error: "Provide 'path' or 'directory'" });
      }
      res.json({ ok: true, result });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/documents/search", async (req, res) => {
    const q = req.query.q;
    const category = req.query.category;
    if (!q) return res.status(400).json({ error: "Query param 'q' required" });
    const keywords = q.split(/\s+/);
    const result = await mockSearch(category, keywords);
    if (!result) return res.json({ found: false });
    res.json({ found: true, type: result.type, data: result.data });
  });

  app.get("/api/documents/faq/search", async (req, res) => {
    const q = req.query.q;
    const category = req.query.category;
    if (!q) return res.status(400).json({ error: "Query param 'q' required" });
    const keywords = q.split(/\s+/);
    const result = await mockSearch(category, keywords);
    if (!result) return res.json({ found: false });
    res.json({ found: true, data: result.data });
  });

  app.get("/api/documents/:id", async (req, res) => {
    const id = req.params.id;
    const result = await mockPool.query("SELECT * FROM documents WHERE id = $1 OR code = $2", [id, id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
    const chunks = await mockPool.query("SELECT * FROM document_chunks WHERE document_id = $1 ORDER BY chunk_number", [result.rows[0].id]);
    res.json({ document: result.rows[0], chunks: chunks.rows });
  });

  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
});

test("POST /api/documents/index sin path devuelve 400", async () => {
  const app = buildTestApp(vi.fn(), vi.fn(), vi.fn(), vi.fn());
  const res = await request(app).post("/api/documents/index").send({});
  expect(res.status).toBe(400);
  expect(res.body.error).toBe("Provide 'path' or 'directory'");
});

test("POST /api/documents/index con path valido devuelve 200", async () => {
  const mockIndexDocument = vi.fn().mockResolvedValue({ code: "FAQ-001", chunks: 3, id: 1 });
  const app = buildTestApp(vi.fn(), mockIndexDocument, vi.fn(), vi.fn());
  const res = await request(app).post("/api/documents/index").send({ path: "/docs/test.md" });
  expect(res.status).toBe(200);
  expect(res.body.ok).toBe(true);
  expect(res.body.result.code).toBe("FAQ-001");
});

test("POST /api/documents/index con directory valido devuelve 200", async () => {
  const mockIndexDirectory = vi.fn().mockResolvedValue([{ code: "doc1", chunks: 2, id: 1 }]);
  const app = buildTestApp(vi.fn(), vi.fn(), mockIndexDirectory, vi.fn());
  const res = await request(app).post("/api/documents/index").send({ directory: "/docs" });
  expect(res.status).toBe(200);
  expect(res.body.ok).toBe(true);
});

test("POST /api/documents/index con error devuelve 500", async () => {
  const mockIndexDocument = vi.fn().mockRejectedValue(new Error("Index error"));
  const app = buildTestApp(vi.fn(), mockIndexDocument, vi.fn(), vi.fn());
  const res = await request(app).post("/api/documents/index").send({ path: "/docs/bad.md" });
  expect(res.status).toBe(500);
  expect(res.body.error).toBe("Index error");
});

test("GET /api/documents/search sin q devuelve 400", async () => {
  const app = buildTestApp(vi.fn(), vi.fn(), vi.fn(), vi.fn());
  const res = await request(app).get("/api/documents/search");
  expect(res.status).toBe(400);
});

test("GET /api/documents/search con resultado devuelve found true", async () => {
  const mockSearch = vi.fn().mockResolvedValue({
    type: "faq",
    data: { question: "Test?", answer: "Answer." }
  });
  const app = buildTestApp(mockSearch, vi.fn(), vi.fn(), vi.fn());
  const res = await request(app).get("/api/documents/search?q=test");
  expect(res.status).toBe(200);
  expect(res.body.found).toBe(true);
  expect(res.body.type).toBe("faq");
});

test("GET /api/documents/search sin resultados devuelve found false", async () => {
  const mockSearch = vi.fn().mockResolvedValue(null);
  const app = buildTestApp(mockSearch, vi.fn(), vi.fn(), vi.fn());
  const res = await request(app).get("/api/documents/search?q=xyz");
  expect(res.status).toBe(200);
  expect(res.body.found).toBe(false);
});

test("GET /api/documents/:id no encontrado devuelve 404", async () => {
  const mockPool = { query: vi.fn().mockResolvedValue({ rows: [] }) };
  const app = buildTestApp(vi.fn(), vi.fn(), vi.fn(), mockPool);
  const res = await request(app).get("/api/documents/999");
  expect(res.status).toBe(404);
});

test("GET /api/documents/:id encontrado devuelve documento y chunks", async () => {
  const mockPool = {
    query: vi.fn()
      .mockResolvedValueOnce({ rows: [{ id: 1, code: "DOC-001", title: "Doc" }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, chunk_number: 1, content: "chunk1" }] })
  };
  const app = buildTestApp(vi.fn(), vi.fn(), vi.fn(), mockPool);
  const res = await request(app).get("/api/documents/DOC-001");
  expect(res.status).toBe(200);
  expect(res.body.document.code).toBe("DOC-001");
  expect(res.body.chunks).toHaveLength(1);
});
