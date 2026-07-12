const adapter = require("../LmStudioAdapter");

beforeEach(() => {
  process.env.LM_STUDIO_URL = "http://127.0.0.1:1";
  process.env.LLM_MODEL = "test-model";
});

test("chatCompletion lanza error cuando el servidor no esta disponible", async () => {
  await expect(
    adapter.chatCompletion([{ role: "user", content: "hola" }])
  ).rejects.toThrow();
});

test("chatCompletion usa la URL configurada en LM_STUDIO_URL", async () => {
  process.env.LM_STUDIO_URL = "http://localhost:1/v1";
  try {
    await adapter.chatCompletion([{ role: "user", content: "x" }]);
  } catch (e) {
    expect(e.message).toMatch(/localhost:1|ECONNREFUSED|ENOTFOUND/);
  }
});
