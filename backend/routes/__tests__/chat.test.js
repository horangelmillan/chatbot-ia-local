const express = require("express");
const request = require("supertest");

function buildTestApp(mockExecute, mockContext) {
  const app = express();
  app.use(express.json());
  app.get("/api/config", (req, res) => {
    res.json({ chatHistoryLimit: parseInt(process.env.CHAT_HISTORY_LIMIT, 10) ?? 6 });
  });
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      const result = await mockExecute({ message, history });
      if (result.reply === "El mensaje no puede estar vacio.") {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ reply: "Algo salio mal, intentalo de nuevo." });
    }
  });
  app.post("/api/chat/reset", (req, res) => {
    mockContext.reset();
    res.json({ ok: true });
  });
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
});

test("GET /api/config devuelve configuracion", async () => {
  process.env.CHAT_HISTORY_LIMIT = "10";
  const mockExecute = vi.fn();
  const mockContext = { reset: vi.fn() };
  const app = buildTestApp(mockExecute, mockContext);
  const res = await request(app).get("/api/config");
  expect(res.status).toBe(200);
  expect(res.body.chatHistoryLimit).toBe(10);
});

test("POST /api/chat con mensaje vacio devuelve 400", async () => {
  const mockExecute = vi.fn().mockResolvedValue({ reply: "El mensaje no puede estar vacio." });
  const app = buildTestApp(mockExecute, { reset: vi.fn() });
  const res = await request(app).post("/api/chat").send({ message: "" });
  expect(res.status).toBe(400);
  expect(res.body.reply).toBe("El mensaje no puede estar vacio.");
});

test("POST /api/chat con mensaje valido devuelve 200", async () => {
  const mockExecute = vi.fn().mockResolvedValue({ reply: "respuesta" });
  const app = buildTestApp(mockExecute, { reset: vi.fn() });
  const res = await request(app).post("/api/chat").send({ message: "hola" });
  expect(res.status).toBe(200);
  expect(res.body.reply).toBe("respuesta");
});

test("POST /api/chat cuando el use case lanza error devuelve 500", async () => {
  const mockExecute = vi.fn().mockRejectedValue(new Error("Algo salio mal"));
  const app = buildTestApp(mockExecute, { reset: vi.fn() });
  const res = await request(app).post("/api/chat").send({ message: "hola" });
  expect(res.status).toBe(500);
});

test("POST /api/chat/reset llama a reset del contexto", async () => {
  const mockReset = vi.fn();
  const app = buildTestApp(vi.fn(), { reset: mockReset });
  const res = await request(app).post("/api/chat/reset");
  expect(res.status).toBe(200);
  expect(mockReset).toHaveBeenCalled();
});
