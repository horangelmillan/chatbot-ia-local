const axios = require("axios");

const chatCompletion = async (messages, temperature = 0.7, httpClient = axios) => {
  const baseUrl = `${process.env.LM_STUDIO_URL || "http://127.0.0.1:1234/v1"}/chat/completions`;
  const model = process.env.LLM_MODEL || "qwen/qwen3-8b";
  const response = await httpClient.post(baseUrl, { model, messages, temperature });
  return response.data.choices[0].message.content;
};

module.exports = { chatCompletion };
