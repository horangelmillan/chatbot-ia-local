const express = require("express");
const cors = require("cors");
require("dotenv").config();

const chatRouter = require("./routes/chat");
const documentsRouter = require("./routes/documents");

const app = express();
const PORT = 3001;

app.use(cors({
  origin: ["http://localhost:8080", "http://127.0.0.1:8080"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json({ limit: "10mb" }));

app.get("/api/config", function (req, res) {
  res.json({ chatHistoryLimit: parseInt(process.env.CHAT_HISTORY_LIMIT, 10) || 6 });
});
app.use("/api/chat", chatRouter);
app.use("/api/documents", documentsRouter);

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});