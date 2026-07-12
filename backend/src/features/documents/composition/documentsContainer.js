const documentRepository = require("../adapters/outbound/postgres/PostgresDocumentRepository");
const documentIndexer = require("../adapters/outbound/postgres/PostgresDocumentIndexer");

const buildDocumentRepository = () => documentRepository;
const buildDocumentIndexer = () => documentIndexer;

module.exports = { buildDocumentRepository, buildDocumentIndexer };
