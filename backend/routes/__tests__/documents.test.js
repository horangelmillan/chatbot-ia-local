const path = require("path");

const mockSearch = vi.fn();
const mockIndexDocument = vi.fn();
const mockIndexDirectory = vi.fn();
const mockPoolQuery = vi.fn();

const docContainerPath = path.resolve(__dirname, "../../src/features/documents/composition/documentsContainer.js");
require.cache[docContainerPath] = {
  id: docContainerPath, filename: docContainerPath, loaded: true,
  exports: {
    buildDocumentRepository: () => ({ search: mockSearch, searchFAQ: mockSearch }),
    buildDocumentIndexer: () => ({ indexDocument: mockIndexDocument, indexDirectory: mockIndexDirectory })
  }
};

const poolPath = path.resolve(__dirname, "../../db/pool.js");
require.cache[poolPath] = {
  id: poolPath, filename: poolPath, loaded: true,
  exports: { query: mockPoolQuery }
};

const request = require("supertest");
const app = require("../../server");

beforeEach(() => { vi.clearAllMocks(); });

test("POST /api/documents/index sin path devuelve 400", async () => {
  const res = await request(app).post("/api/documents/index").send({});
  expect(res.status).toBe(400);
  expect(res.body.error).toBe("Provide 'path' or 'directory'");
});

test("POST /api/documents/index con path valido devuelve 200", async () => {
  mockIndexDocument.mockResolvedValue({ code: "FAQ-001", chunks: 3, id: 1 });
  const res = await request(app).post("/api/documents/index").send({ path: "/docs/test.md" });
  expect(res.status).toBe(200);
  expect(res.body.ok).toBe(true);
  expect(res.body.result.code).toBe("FAQ-001");
});

test("POST /api/documents/index con directory valido devuelve 200", async () => {
  mockIndexDirectory.mockResolvedValue([{ code: "doc1", chunks: 2, id: 1 }]);
  const res = await request(app).post("/api/documents/index").send({ directory: "/docs" });
  expect(res.status).toBe(200);
  expect(res.body.ok).toBe(true);
});

test("POST /api/documents/index con error devuelve 500", async () => {
  mockIndexDocument.mockRejectedValue(new Error("Index error"));
  const res = await request(app).post("/api/documents/index").send({ path: "/docs/bad.md" });
  expect(res.status).toBe(500);
  expect(res.body.error).toBe("Index error");
});

test("GET /api/documents/search sin q devuelve 400", async () => {
  const res = await request(app).get("/api/documents/search");
  expect(res.status).toBe(400);
});

test("GET /api/documents/search con resultado devuelve found true", async () => {
  mockSearch.mockResolvedValue({
    type: "faq",
    data: { question: "Test?", answer: "Answer." }
  });
  const res = await request(app).get("/api/documents/search?q=test");
  expect(res.status).toBe(200);
  expect(res.body.found).toBe(true);
  expect(res.body.type).toBe("faq");
});

test("GET /api/documents/search sin resultados devuelve found false", async () => {
  mockSearch.mockResolvedValue(null);
  const res = await request(app).get("/api/documents/search?q=xyz");
  expect(res.status).toBe(200);
  expect(res.body.found).toBe(false);
});

test("GET /api/documents/:id no encontrado devuelve 404", async () => {
  mockPoolQuery.mockResolvedValue({ rows: [] });
  const res = await request(app).get("/api/documents/999");
  expect(res.status).toBe(404);
});

test("GET /api/documents/:id encontrado devuelve documento y chunks", async () => {
  mockPoolQuery
    .mockResolvedValueOnce({ rows: [{ id: 1, code: "DOC-001", title: "Doc" }] })
    .mockResolvedValueOnce({ rows: [{ id: 1, chunk_number: 1, content: "chunk1" }] });
  const res = await request(app).get("/api/documents/DOC-001");
  expect(res.status).toBe(200);
  expect(res.body.document.code).toBe("DOC-001");
  expect(res.body.chunks).toHaveLength(1);
});

describe.skip("Autenticacion", () => {
  test("POST /api/documents/index sin token devuelve 401", async () => {
    const res = await request(app)
      .post("/api/documents/index")
      .send({ path: "/test.md" });
    expect(res.status).toBe(401);
  });

  test("GET /api/documents/search sin token devuelve 401", async () => {
    const res = await request(app).get("/api/documents/search?q=test");
    expect(res.status).toBe(401);
  });
});
