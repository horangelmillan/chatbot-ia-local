const axios = require("axios");

const BASE_URL = (process.env.LM_STUDIO_URL || "http://127.0.0.1:1234/v1") + "/chat/completions";
var model = process.env.LLM_MODEL || "qwen/qwen3-8b";

async function chatCompletion(messages, temperature) {
  if (temperature === undefined) temperature = 0.7;
  var response = await axios.post(BASE_URL, {
    model: model,
    messages: messages,
    temperature: temperature
  });
  return response.data.choices[0].message.content;
}

module.exports = { chatCompletion };
