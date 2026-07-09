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

function calcTotal(details) {
  if (!details) return 0;
  return details.reduce(function (sum, d) {
    return sum + d.Quantity * parseFloat(d.UnitPrice) * (1 - (d.Discount || 0));
  }, 0);
}

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
          '- Para responder tu mismo (saludos, analisis, opinion, o si la consulta no es una sola entidad): {"intent":"reply","text":"..."}\n' +
          '- Para continuar con lo ultimo consultado: {"intent":"continuation"}\n' +
          '- Fuera del alcance: {"intent":"unknown"}\n\n' +
          "NO inventes entidades, campos, operadores ni relaciones. Usa SOLO lo listado. Si te piden datos aleatorios o multiples entidades, usa reply."
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

async function enrichOrderContext(data) {
  if (!data || data.length === 0) return data;
  var o = data[0];
  var total = calcTotal(o.Order_Details);
  o._total = total;
  if (o.CustomerID && data.length < 2) {
    try {
      var url = NW_BASE + "/Orders?$filter=CustomerID eq '" + o.CustomerID + "'&$expand=Order_Details&$top=5";
      var res = await axios.get(url, { headers: { Accept: "application/json" }, timeout: 10000 });
      var similar = res.data.value || [];
      similar = similar.filter(function (s) { return s.OrderID !== o.OrderID; });
      similar.forEach(function (s) {
        s._total = calcTotal(s.Order_Details);
      });
      o._similarOrders = similar.slice(0, 3);
    } catch (e) {
      o._similarOrders = null;
    }
  }
  return data;
}

function buildContext(entity, data) {
  if (!data || data.length === 0) return "";
  if (entity === "Orders") {
    var o = data[0];
    var c = o.Customer || {};
    var details = o.Order_Details || [];
    var total = o._total || calcTotal(details);
    var lines = [
      "Orden #" + o.OrderID,
      "Cliente: " + (c.CompanyName || o.CustomerID) + " (" + (c.ContactName || "") + ")",
      "Fecha: " + (o.OrderDate || "N/A"),
      "Envio: " + (o.ShipName || "") + ", " + (o.ShipAddress || "") + ", " + (o.ShipCity || "") + " " + (o.ShipCountry || ""),
      "Total calculado: $" + total.toFixed(2),
      "Productos (" + details.length + "):"
    ];
    details.forEach(function (d) {
      var subtotal = (d.Quantity * d.UnitPrice * (1 - (d.Discount || 0))).toFixed(2);
      lines.push("  - Producto #" + d.ProductID + " x" + d.Quantity + " @ $" + d.UnitPrice + " = $" + subtotal);
    });
    if (o._similarOrders && o._similarOrders.length > 0) {
      lines.push("Otras ordenes del mismo cliente:");
      o._similarOrders.forEach(function (s) {
        lines.push("  #" + s.OrderID + " - " + (s.OrderDate || "N/A") + " - Total: $" + (s._total || 0).toFixed(2));
      });
    }
    return lines.join("\n");
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
    var granTotal = items.reduce(function (sum, d) {
      return sum + d.Quantity * parseFloat(d.UnitPrice) * (1 - (d.Discount || 0));
    }, 0);
    return [
      "Facturacion - Orden #" + (order.OrderID || ""),
      "Fecha: " + (order.OrderDate || "N/A"),
      "Cliente: " + (order.CustomerID || ""),
      "Total: $" + granTotal.toFixed(2),
      "Lineas:"
    ].concat(items.map(function (d) {
      var subtotal = (d.Quantity * d.UnitPrice * (1 - (d.Discount || 0))).toFixed(2);
      return "  - Producto #" + d.ProductID + " x" + d.Quantity + " @ $" + d.UnitPrice + " = $" + subtotal;
    })).join("\n");
  }
  return JSON.stringify(data.slice(0, 5), null, 2);
}

async function generateReply(message, context, history) {
  var messages = [
    {
      role: "system",
      content:
        "Habla como un colega que entiende de datos, no como un manual tecnico. " +
        "Usa frases naturales, contracciones (no, esta, hay), y evita empezar con 'Claro!' o 'Por supuesto'. " +
        "No digas 'en el contexto proporcionado' ni 'como asistente AI'. " +
        "Si los datos estan, responde directo. Si falta algo, dilo simple. " +
        "Se conciso pero con tono conversacional, como si estuvieras ayudando a un companero."
    }
  ];
  if (history && Array.isArray(history)) {
    messages = messages.concat(history.slice(-6));
  }
  messages.push({
    role: "user",
    content:
      'Mensaje: "' + message + '"\n\n' +
      "Datos de Northwind:\n" + (context || "No hay datos.") + "\n\n" +
      "Responde de forma natural."
  });
  var response = await axios.post(LM_URL, {
    model: "qwen/qwen3-8b",
    messages: messages,
    temperature: 0.8
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
    console.log("=== RAW LLM ===", raw);
    var decision;
    try {
      var cleaned = raw.replace(/```(?:json)?\s*([\s\S]*?)```/i, "$1").trim();
      decision = JSON.parse(cleaned);
    } catch (e) {
      console.error("JSON parse error:", e.message, "| RAW:", raw);
      var m = raw.match(/\{[\s\S]*?\}/);
      if (m) try { decision = JSON.parse(m[0]); } catch (e2) { decision = { intent: "reply", text: raw.replace(/```/g, "").trim() }; }
      else decision = { intent: "reply", text: raw.replace(/```/g, "").trim() };
    }
    if (decision.intent === "unknown") {
      return res.json({
        reply: "No puedo ayudar con eso, solo manejo datos de ordenes, clientes y facturacion."
      });
    }
    if (decision.intent === "reply") {
      return res.json({ reply: decision.text || "OK" });
    }
    if (decision.intent === "continuation") {
      if (!lastContext) {
        return res.json({ reply: "Aun no has consultado nada, preguntame por alguna orden o cliente." });
      }
      var reply = await generateReply(message, lastContext.context, history);
      return res.json({ reply: reply });
    }
    if (decision.intent === "query") {
      var error = validateQuery(decision.entity, decision.filters, decision.expand, decision.top);
      if (error) {
        return res.json({ reply: error });
      }
      var data = await queryNorthwind(decision.entity, decision.filters, decision.expand, decision.top);
      if (decision.entity === "Orders") {
        data = await enrichOrderContext(data);
      }
      var context = buildContext(decision.entity, data);
      lastContext = { intent: decision.entity, id: (decision.filters && decision.filters[0] ? decision.filters[0].value : ""), context: context };
      var reply = await generateReply(message, context, history);
      return res.json({ reply: reply });
    }
    return res.json({ reply: "No entendi, puedes repetirlo?" });
  } catch (error) {
    console.error("=== ERROR /api/chat ===");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    if (error.response) console.error("Response data:", JSON.stringify(error.response.data).slice(0, 500));
    res.status(500).json({ reply: "Algo salio mal, intentalo de nuevo." });
  }
});

router.post("/reset", function (req, res) {
  lastContext = null;
  res.json({ ok: true });
});

module.exports = router;
