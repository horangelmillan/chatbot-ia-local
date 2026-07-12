const path = require("path");
require("dotenv").config();
const { buildDocumentIndexer } = require("../src/features/documents/composition/documentsContainer");

const kbPath = process.env.KNOWLEDGE_BASE_PATH || path.resolve(__dirname, "..", "knowledge-base");
const indexer = buildDocumentIndexer();

indexer.indexDirectory(kbPath)
  .then((r) => {
    console.log(`KB indexada: ${r.length} documentos desde ${kbPath}`);
    process.exit(0);
  })
  .catch((e) => {
    console.error("Error indexando KB:", e.message);
    process.exit(1);
  });
