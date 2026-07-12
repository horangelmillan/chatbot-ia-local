const { ChatUseCase } = require("../application/use-cases/ChatUseCase");
const llmAdapter = require("../adapters/outbound/lmstudio/LmStudioAdapter");
const odataAdapter = require("../adapters/outbound/northwind/NorthwindODataAdapter");
const chatContext = require("../adapters/outbound/memory/InMemoryChatContext");
const { buildDocumentRepository } = require("../../documents/composition/documentsContainer");

function buildChatUseCase() {
  return new ChatUseCase(llmAdapter, odataAdapter, buildDocumentRepository(), chatContext);
}

function buildChatContext() {
  return chatContext;
}

module.exports = { buildChatUseCase, buildChatContext };
