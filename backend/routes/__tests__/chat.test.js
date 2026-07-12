const path = require("path");

const mockExecute = vi.fn();
const mockReset = vi.fn();
const chatContainerPath = path.resolve(__dirname, "../../src/features/chat/composition/chatContainer.js");
require.cache[chatContainerPath] = {
  id: chatContainerPath, filename: chatContainerPath, loaded: true,
  exports: {
    buildChatUseCase: () => ({ execute: mockExecute }),
    buildChatContext: () => ({ reset: mockReset })
  }
};

const request = require("supertest");
const app = require("../../server");

beforeEach(() => { vi.clearAllMocks(); });

test("GET /api/config devuelve configuracion", async () => {
  process.env.CHAT_HISTORY_LIMIT = "10";
  const res = await request(app).get("/api/config");
  expect(res.status).toBe(200);
  expect(res.body.chatHistoryLimit).toBe(10);
});

test("POST /api/chat con mensaje vacio devuelve 400", async () => {
  mockExecute.mockResolvedValue({ reply: "El mensaje no puede estar vacio." });
  const res = await request(app).post("/api/chat").send({ message: "" });
  expect(res.status).toBe(400);
  expect(res.body.reply).toBe("El mensaje no puede estar vacio.");
});

test("POST /api/chat con mensaje valido devuelve 200", async () => {
  mockExecute.mockResolvedValue({ reply: "respuesta" });
  const res = await request(app).post("/api/chat").send({ message: "hola" });
  expect(res.status).toBe(200);
  expect(res.body.reply).toBe("respuesta");
});

test("POST /api/chat cuando el use case lanza error devuelve 500", async () => {
  mockExecute.mockRejectedValue(new Error("Algo salio mal"));
  const res = await request(app).post("/api/chat").send({ message: "hola" });
  expect(res.status).toBe(500);
});

test("POST /api/chat/reset llama a reset del contexto", async () => {
  const res = await request(app).post("/api/chat/reset");
  expect(res.status).toBe(200);
  expect(mockReset).toHaveBeenCalled();
});

describe.skip("Autenticacion", () => {
  test("POST /api/chat sin token devuelve 401", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send({ message: "hola" })
      .set("Authorization", "");
    expect(res.status).toBe(401);
  });

  test("GET /api/config sin token devuelve 401", async () => {
    const res = await request(app).get("/api/config");
    expect(res.status).toBe(401);
  });

  test("POST /api/chat con token valido devuelve 200", async () => {
    mockExecute.mockResolvedValue({ reply: "ok" });
    const res = await request(app)
      .post("/api/chat")
      .send({ message: "hola" })
      .set("Authorization", "Bearer valid-token");
    expect(res.status).toBe(200);
  });
});
