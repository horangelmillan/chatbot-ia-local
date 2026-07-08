const express = require("express");
const axios = require("axios");

const router = express.Router();
const LM_URL = process.env.LM_STUDIO_URL + "/chat/completions";

async function classifyIntent(message) {
  const response = await axios.post(LM_URL, {
    model: "qwen/qwen3-8b",
    messages: [
      {
        role: "system",
        content:
          "Eres un clasificador de intenciones. Responde ÚNICAMENTE con JSON " +
          'como {"intent": "order|customer|invoice|unknown", "id": "..."}. ' +
          "Extrae el ID numérico o código del mensaje. " +
          "Ejemplo: 'orden 10248' → {\"intent\": \"order\", \"id\": \"10248\"}. " +
          "'cliente ALFKI' → {\"intent\": \"customer\", \"id\": \"ALFKI\"}. " +
          "'quien gano el mundial' → {\"intent\": \"unknown\", \"id\": \"\"}."
      },
      { role: "user", content: message }
    ],
    temperature: 0.1
  });

  return response.data.choices[0].message.content;
}

async function generateReply(message, intent, id) {
  const response = await axios.post(LM_URL, {
    model: "qwen/qwen3-8b",
    messages: [
      {
        role: "system",
        content:
          "Eres un asistente especializado en órdenes, clientes y facturación. " +
          "Usa EXCLUSIVAMENTE la información proporcionada. No inventes datos. " +
          "Sé conciso y profesional."
      },
      {
        role: "user",
        content:
          `Mensaje: "${message}"\n` +
          `Intención detectada: ${intent} (ID: ${id || "ninguno"})\n\n` +
          "Proporciona una respuesta útil. Como aún no hay acceso a la base de datos, " +
          "indica qué información consultarías y da un ejemplo ilustrativo."
      }
    ],
    temperature: 0.7
  });

  return response.data.choices[0].message.content;
}

router.post("/", async (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ reply: "El mensaje no puede estar vacío." });
  }

  try {
    const rawClassification = await classifyIntent(message);
    let parsed;

    try {
      parsed = JSON.parse(rawClassification);
    } catch {
      return res.status(500).json({ reply: "Error al procesar la respuesta del modelo." });
    }

    const { intent, id } = parsed;

    if (intent === "unknown") {
      return res.json({
        reply:
          "No puedo ayudar con esa consulta. Soy un asistente especializado en procesos de proveedores y facturación."
      });
    }

    const reply = await generateReply(message, intent, id);
    res.json({ reply });
  } catch (error) {
    console.error("Error en /api/chat:", error.message);
    res.status(500).json({ reply: "Error interno del servidor." });
  }
});

module.exports = router;