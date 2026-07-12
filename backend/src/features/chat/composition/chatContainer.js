const llmAdapter = require("../adapters/outbound/lmstudio/LmStudioAdapter");

function buildLLM() {
  return llmAdapter;
}

module.exports = { buildLLM };
