const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const chatRouter = require("./routes/chat");
const documentsRouter = require("./routes/documents");
const { buildDocumentIndexer } = require("./src/features/documents/composition/documentsContainer");

const app = express();
const PORT = 3001;

app.use(cors({
  origin: ["http://localhost:8080", "http://127.0.0.1:8080"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json({ limit: "10mb" }));

app.get("/api/config", (req, res) => {
  res.json({ chatHistoryLimit: parseInt(process.env.CHAT_HISTORY_LIMIT, 10) ?? 6 });
});
app.use("/api/chat", chatRouter);
app.use("/api/documents", documentsRouter);

if (process.env.INDEX_KB_ON_START === "true" && process.env.NODE_ENV !== "test") {
  const kbPath = process.env.KNOWLEDGE_BASE_PATH || path.resolve(__dirname, "..", "knowledge-base");
  const indexer = buildDocumentIndexer();
  indexer.indexDirectory(kbPath)
    .then((r) => console.log(`KB auto-indexada: ${r.length} documentos desde ${kbPath}`))
    .catch((e) => console.error("KB auto-index fallo:", e.message));
}

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
  });
}

module.exports = app;
