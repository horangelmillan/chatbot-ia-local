const adapter = require("../LmStudioAdapter");

function mockAxios(status = 200, data = null) {
  return {
    post: vi.fn().mockResolvedValue({
      status,
      data: data || { choices: [{ message: { content: "respuesta mock" } }] }
    })
  };
}

beforeEach(() => {
  process.env.LM_STUDIO_URL = "http://localhost:1234/v1";
  process.env.LLM_MODEL = "test-model";
});

test("chatCompletion devuelve el contenido del mensaje", async () => {
  const http = mockAxios();
  const result = await adapter.chatCompletion(
    [{ role: "user", content: "hola" }], 0.7, http
  );
  expect(result).toBe("respuesta mock");
  expect(http.post.mock.calls[0][0]).toBe("http://localhost:1234/v1/chat/completions");
  expect(http.post.mock.calls[0][1]).toMatchObject({
    model: "test-model",
    messages: [{ role: "user", content: "hola" }],
    temperature: 0.7
  });
});

test("chatCompletion usa la URL de LM_STUDIO_URL", async () => {
  process.env.LM_STUDIO_URL = "http://custom:9999/v1";
  const http = mockAxios();
  await adapter.chatCompletion([{ role: "user", content: "x" }], 0.7, http);
  expect(http.post.mock.calls[0][0]).toBe("http://custom:9999/v1/chat/completions");
});
