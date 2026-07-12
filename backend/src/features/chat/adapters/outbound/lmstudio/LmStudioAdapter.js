const axios = require("axios");

const BASE_URL = `${process.env.LM_STUDIO_URL || "http://127.0.0.1:1234/v1"}/chat/completions`;
const model = process.env.LLM_MODEL || "qwen/qwen3-8b";

const chatCompletion = async (messages, temperature = 0.7) => {
  const response = await axios.post(BASE_URL, { model, messages, temperature });
  return response.data.choices[0].message.content;
};

module.exports = { chatCompletion };
