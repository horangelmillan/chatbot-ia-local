var MAX_HISTORY = parseInt(process.env.CHAT_HISTORY_LIMIT, 10) || 6;
var DOC_CATEGORIES = ["Facturacion", "Proveedores", "Pagos", "General"];

function ChatUseCase(llm, odata, documentRepository, chatContext) {
  this.llm = llm;
  this.odata = odata;
  this.documentRepository = documentRepository;
  this.chatContext = chatContext;
}

ChatUseCase.prototype.execute = async function (input) {
  var message = input.message;
  var history = input.history || [];

  if (!message || !message.trim()) {
    return { reply: "El mensaje no puede estar vacio." };
  }

  try {
    var raw = await this.decideAction(message);
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
      return { reply: "No puedo ayudar con eso, solo manejo datos de ordenes, clientes y facturacion." };
    }

    if (decision.intent === "reply") {
      return { reply: decision.text || "OK", buttons: decision.buttons || null };
    }

    if (decision.intent === "continuation") {
      var ctx = this.chatContext.get();
      if (!ctx) {
        return { reply: "Aun no has consultado nada, preguntame por alguna orden o cliente." };
      }
      var reply = await this.generateReply(message, ctx.context, history);
      return { reply: reply };
    }

    if (decision.intent === "document_query") {
      var result = await this.documentRepository.search(decision.category, decision.keywords);
      if (!result) {
        return { reply: "No encontre documentacion sobre ese tema." };
      }
      var data = result.data;
      var reply;
      if (result.type === "faq") {
        reply = data.question + "\n\n" + data.answer;
      } else {
        reply = data.title ? data.title + "\n\n" + data.content : data.content;
      }
      return { reply: reply, type: "document" };
    }

    if (decision.intent === "query") {
      var error = this.validateQuery(decision.entity, decision.filters, decision.expand, decision.top);
      if (error) {
        return { reply: error };
      }
      var data = await this.odata.query(decision.entity, decision.filters, decision.expand, decision.top);
      if (decision.entity === "Orders") {
        data = await this.enrichOrderContext(data);
      }
      var context = this.buildContext(decision.entity, data);
      this.chatContext.set({ intent: decision.entity, id: (decision.filters && decision.filters[0] ? decision.filters[0].value : ""), context: context });
      var reply = await this.generateReply(message, context, history);
      return { reply: reply, buttons: decision.buttons || null };
    }

    return { reply: "No entendi, puedes repetirlo?" };
  } catch (error) {
    console.error("=== ERROR ChatUseCase ===");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    if (error.response) console.error("Response data:", JSON.stringify(error.response.data).slice(0, 500));
    throw error;
  }
};

ChatUseCase.prototype.decideAction = async function (message) {
  var schemaDesc = this.odata.getSchemaDescription();
  var last = this.chatContext.get()
    ? "Ultimo contexto consultado: " + this.chatContext.get().intent + " (ID: " + this.chatContext.get().id + ")"
    : "No hay consulta previa.";

  var messages = [
    {
      role: "system",
      content:
        "Eres un planificador de consultas.\n\n" +
        "Northwind:\n" + schemaDesc + "\n\n" +
        "Documentacion disponible:\n" + DOC_CATEGORIES.join(", ") + "\n\n" +
        last + "\n\n" +
        "Formato de respuesta SOLO JSON:\n" +
         '- Para consultar Northwind: {"intent":"query","entity":"...","filters":[{"field":"...","op":"eq","value":"..."}],"expand":["..."],"top":N}\n' +
         '- Para responder tu mismo (saludos, analisis, opinion, o si la consulta no es una sola entidad): {"intent":"reply","text":"..."}\n' +
         '- Para preguntas sobre procesos internos, documentacion o FAQ: {"intent":"document_query","category":"Facturacion","keywords":["factura","registro"]}\n' +
          '- Cuando respondas datos de Northwind, sugiere 2-3 acciones de seguimiento en buttons:\n' +
          '   * Si mostraste un pedido: botones para "Ver cliente", "Ver factura", "Buscar otro pedido"\n' +
          '   * Si mostraste un cliente: botones para "Ver sus pedidos", "Buscar otro cliente"\n' +
          '   * Si es una factura: botones para "Ver pedido completo", "Buscar otra factura"\n' +
          '- Si toca ofrecer opciones al usuario, agrega buttons a reply o query: {"intent":"reply","text":"...","buttons":[{"label":"Sí","message":"sí quiero seguir"}]}\n' +
         '- Para continuar con lo ultimo consultado: {"intent":"continuation"}\n' +
        '- Fuera del alcance: {"intent":"unknown"}\n\n' +
        "NO inventes entidades, campos, operadores ni relaciones. Usa SOLO lo listado. Para documentacion, solo devuelve categoria y palabras clave, NO redactes la respuesta."
    },
    { role: "user", content: message }
  ];
  return await this.llm.chatCompletion(messages, 0.1);
};

ChatUseCase.prototype.generateReply = async function (message, context, history) {
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
    messages = messages.concat(history.slice(-MAX_HISTORY));
  }
  messages.push({
    role: "user",
    content: 'Mensaje: "' + message + '"\n\n' +
      "Datos de Northwind:\n" + (context || "No hay datos.") + "\n\n" +
      "Responde de forma natural."
  });
  return await this.llm.chatCompletion(messages, 0.8);
};

ChatUseCase.prototype.validateQuery = function (entity, filters, expand, top) {
  var allowed = this.odata.getSchema()[entity];
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
};

ChatUseCase.prototype.enrichOrderContext = async function (data) {
  if (!data || data.length === 0) return data;
  var o = data[0];
  o._total = this.odata.calcTotal(o.Order_Details);
  if (o.CustomerID && data.length < 2) {
    o._similarOrders = await this.odata.findSimilarOrders(o.CustomerID, o.OrderID);
  }
  return data;
};

ChatUseCase.prototype.buildContext = function (entity, data) {
  if (!data || data.length === 0) return "";
  if (entity === "Orders") {
    var o = data[0];
    var c = o.Customer || {};
    var details = o.Order_Details || [];
    var total = o._total || this.odata.calcTotal(details);
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
};

module.exports = { ChatUseCase };
