const documentRepository = require("../adapters/outbound/postgres/PostgresDocumentRepository");
const documentIndexer = require("../adapters/outbound/postgres/PostgresDocumentIndexer");

function buildDocumentRepository() {
  return documentRepository;
}

function buildDocumentIndexer() {
  return documentIndexer;
}

module.exports = { buildDocumentRepository, buildDocumentIndexer };
