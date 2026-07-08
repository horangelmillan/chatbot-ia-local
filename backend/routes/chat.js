const express = require("express");
const axios = require("axios");

const router = express.Router();
const LM_URL = process.env.LM_STUDIO_URL + "/chat/completions";
const NW_BASE = "https://services.odata.org/V3/Northwind/Northwind.svc";

const ALLOWED = {
  Orders: { filters: ["OrderID", "CustomerID", "ShipCountry", "ShipCity", "OrderDate"], expand: ["Customer", "Order_Details"], maxTop: 50 },
  Customers: { filters: ["CustomerID", "CompanyName", "Country", "City"], expand: ["Orders"], maxTop: 50 },
  Order_Details: { filters: ["OrderID", "ProductID"], expand: ["Order"], maxTop: 50 }
};

let lastContext = null;

function validateQuery(entity, filters, expand, top) {
  var allowed = ALLOWED[entity];
  if (!allowed) return "Entidad no valida: " + entity;
  if (filters) {
    for (var i = 0; i < filters.length; i++) {
      var f = filters[i];
      if (!allowed.filters.includes(f.field)) return "Filtro no valido: " + f.field;
      if (f.op !== "eq") return "Operador no valido: " + f.op;
    }
  }
  if (expand) {
    for (var j = 0; j < expand.length; j++) {
      if (!allowed.expand.includes(expand[j])) return "Expand no valido: " + expand[j];
    }
  }
  if (top && (top < 1 || top > allowed.maxTop)) return "Top fuera de rango (max " + allowed.maxTop + ")";
  return null;
}

async function decideAction(message) {
  var schemaDesc = Object.keys(ALLOWED).map(function (e) {
    return e + " (filtros: " + ALLOWED[e].filters.join(", ") + ", expand: " + ALLOWED[e].expand.join(", ") + ")";
  }).join("\n");
  var last = lastContext ? "Ultimo contexto consultado: " + lastContext.intent + " (ID: " + lastContext.id + ")" : "No hay consulta previa.";
  var response = await axios.post(LM_URL, {
    model: "qwen/qwen3-8b",
    messages: [
      {
        role: "system",
        content:
          "Eres un planificador de consultas Northwind.\n\n" +
          "Entidades:\n" + schemaDesc + "\n\n" +
          last + "\n\n" +
          "Formato de respuesta SOLO JSON:\n" +
          '- Para consultar Northwind: {"intent":"query","entity":"...","filters":[{"field":"...","op":"eq","value":"..."}],"expand":["..."],"top":N}\n' +
          '- Para responder tu mismo (saludos, analisis, opinion): {"intent":"reply","text":"..."}\n' +
          '- Para continuar con lo ultimo consultado: {"intent":"continuation"}\n' +
          '- Fuera del alcance: {"intent":"unknown"}\n\n' +
          "NO inventes entidades, campos, operadores ni relaciones. Usa SOLO lo listado."
      },
      { role: "user", content: message }
    ],
    temperature: 0.1
  });
  return response.data.choices[0].message.content;
}

async function queryNorthwind(entity, filters, expand, top) {
  var params = [];
  if (filters && filters.length > 0) {
    var parts = filters.map(function (f) {
      var val = typeof f.value === "number" ? f.value : "'" + f.value + "'";
      return f.field + " " + f.op + " " + val;
    });
    params.push("$filter=" + encodeURIComponent(parts.join(" and ")));
  }
  if (expand && expand.length > 0) {
    params.push("$expand=" + expand.join(","));
  }
  if (top) {
    params.push("$top=" + top);
  }
  var url = NW_BASE + "/" + entity + (params.length > 0 ? "?" + params.join("&") : "");
  var res = await axios.get(url, { headers: { Accept: "application/json" }, timeout: 10000 });
  return res.data.value;
}

function buildContext(entity, data) {
  if (!data || data.length === 0) return "";
  if (entity === "Orders") {
    var o = data[0];
    var c = o.Customer || {};
    var details = o.Order_Details || [];
    return [
      "Orden #" + o.OrderID,
      "Cliente: " + (c.CompanyName || o.CustomerID) + " (" + (c.ContactName || "") + ")",
      "Fecha: " + (o.OrderDate || "N/A"),
      "Envio: " + (o.ShipName || "") + ", " + (o.ShipAddress || "") + ", " + (o.ShipCity || "") + " " + (o.ShipCountry || ""),
      "Productos:"
    ].concat(details.map(function (d) {
      return "  - Producto #" + d.ProductID + " x" + d.Quantity + " @ $" + d.UnitPrice + " (desc: " + (d.Discount || 0) + ")";
    })).concat(data.length > 1 ? "" : "").join("\n");
  }
  if (entity === "Customers") {
    var c = data[0];
    if (!c || !c.CustomerID) return "";
    var orders = c.Orders || [];
    return [
      "Cliente: " + (c.CompanyName || ""),
      "Contacto: " + (c.ContactName || "") + ", " + (c.ContactTitle || ""),
      "Direccion: " + (c.Address || "") + ", " + (c.City || "") + ", " + (c.Country || ""),
      "Tel: " + (c.Phone || ""),
      "Ordenes (" + orders.length + "):"
    ].concat(orders.slice(0, 10).map(function (o) {
      return "  #" + o.OrderID + " - " + (o.OrderDate || "N/A") + " $" + (o.Freight || 0);
    })).join("\n");
  }
  if (entity === "Order_Details") {
    var items = data;
    var first = items[0];
    var order = first.Order || {};
    return [
      "Facturacion - Orden #" + (order.OrderID || ""),
      "Fecha: " + (order.OrderDate || "N/A"),
      "Cliente: " + (order.CustomerID || ""),
      "Lineas:"
    ].concat(items.map(function (d) {
      var total = (d.Quantity * d.UnitPrice * (1 - (d.Discount || 0))).toFixed(2);
      return "  - Producto #" + d.ProductID + " x" + d.Quantity + " @ $" + d.UnitPrice + " = $" + total;
    })).join("\n");
  }
  return JSON.stringify(data.slice(0, 5), null, 2);
}

async function generateReply(message, context, history) {
  var messages = [
    {
      role: "system",
      content:
        "Eres un asistente especializado en ordenes, clientes y facturacion. " +
        "Usa EXCLUSIVAMENTE la informacion proporcionada en el contexto. No inventes datos. " +
        "Se conciso y profesional."
    }
  ];
  if (history && Array.isArray(history)) {
    messages = messages.concat(history.slice(-6));
  }
  messages.push({
    role: "user",
    content:
      'Mensaje: "' + message + '"\n\n' +
      "Contexto de Northwind:\n" + (context || "No hay datos disponibles.") + "\n\n" +
      "Responde al usuario basandote en el contexto."
  });
  var response = await axios.post(LM_URL, {
    model: "qwen/qwen3-8b",
    messages: messages,
    temperature: 0.7
  });
  return response.data.choices[0].message.content;
}

router.post("/", async function (req, res) {
  var message = req.body.message;
  var history = req.body.history;
  if (!message || !message.trim()) {
    return res.status(400).json({ reply: "El mensaje no puede estar vacio." });
  }
  try {
    var raw = await decideAction(message);
    var decision;
    try {
      decision = JSON.parse(raw);
    } catch (e) {
      return res.status(500).json({ reply: "Error al procesar la respuesta del modelo." });
    }
    if (decision.intent === "unknown") {
      return res.json({
        reply: "No puedo ayudar con esa consulta. Soy un asistente especializado en procesos de proveedores y facturacion."
      });
    }
    if (decision.intent === "reply") {
      return res.json({ reply: decision.text || "OK" });
    }
    if (decision.intent === "continuation") {
      if (!lastContext) {
        return res.json({ reply: "No hay consulta previa. Preguntame algo sobre ordenes, clientes o facturacion." });
      }
      var reply = await generateReply(message, lastContext.context, history);
      return res.json({ reply: reply });
    }
    if (decision.intent === "query") {
      var error = validateQuery(decision.entity, decision.filters, decision.expand, decision.top);
      if (error) {
        return res.json({ reply: "Error: " + error });
      }
      var data = await queryNorthwind(decision.entity, decision.filters, decision.expand, decision.top);
      var context = buildContext(decision.entity, data);
      lastContext = { intent: decision.entity, id: (decision.filters && decision.filters[0] ? decision.filters[0].value : ""), context: context };
      var reply = await generateReply(message, context, history);
      return res.json({ reply: reply });
    }
    return res.json({ reply: "No se pudo procesar la solicitud." });
  } catch (error) {
    console.error("Error en /api/chat:", error.message);
    res.status(500).json({ reply: "Error interno del servidor." });
  }
});

module.exports = router;
