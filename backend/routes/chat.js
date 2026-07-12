const express = require("express");
const { buildChatUseCase } = require("../src/features/chat/composition/chatContainer");

const router = express.Router();
const chatUseCase = buildChatUseCase();

router.post("/", async (req, res) => {
  try {
    const { message, history } = req.body;
    const result = await chatUseCase.execute({ message, history });
    if (result.reply === "El mensaje no puede estar vacio.") {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error("=== ERROR /api/chat ===", error.message);
    res.status(500).json({ reply: "Algo salio mal, intentalo de nuevo." });
  }
});

router.post("/reset", (req, res) => {
  const { buildChatContext } = require("../src/features/chat/composition/chatContainer");
  const ctx = buildChatContext();
  ctx.reset();
  res.json({ ok: true });
});

module.exports = router;
