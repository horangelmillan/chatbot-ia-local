const express = require("express");
const { buildChatUseCase } = require("../src/features/chat/composition/chatContainer");

const router = express.Router();
var chatUseCase = buildChatUseCase();

router.post("/", async function (req, res) {
  try {
    var result = await chatUseCase.execute({ message: req.body.message, history: req.body.history });
    if (result.reply === "El mensaje no puede estar vacio.") {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error("=== ERROR /api/chat ===", error.message);
    res.status(500).json({ reply: "Algo salio mal, intentalo de nuevo." });
  }
});

router.post("/reset", function (req, res) {
  var { buildChatContext } = require("../src/features/chat/composition/chatContainer");
  var ctx = buildChatContext();
  ctx.reset();
  res.json({ ok: true });
});

module.exports = router;
