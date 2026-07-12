const MAX_HISTORY = parseInt(process.env.CHAT_HISTORY_LIMIT, 10) ?? 6;
const DOC_CATEGORIES = ["Facturacion", "Proveedores", "Pagos", "General"];

class ChatUseCase {
  constructor(llm, odata, documentRepository, chatContext) {
    this.llm = llm;
    this.odata = odata;
    this.documentRepository = documentRepository;
    this.chatContext = chatContext;
  }

  async execute({ message, history = [] }) {
    if (!message || !message.trim()) {
      return { reply: "El mensaje no puede estar vacio." };
    }

    try {
      const raw = await this.decideAction(message);
      console.log("=== RAW LLM ===", raw);
      let decision;
      try {
        const cleaned = raw.replace(/```(?:json)?\s*([\s\S]*?)```/i, "$1").trim();
        decision = JSON.parse(cleaned);
      } catch (e) {
        console.error("JSON parse error:", e.message, "| RAW:", raw);
        const m = raw.match(/\{[\s\S]*?\}/);
        if (m) try { decision = JSON.parse(m[0]); } catch (e2) { decision = { intent: "reply", text: raw.replace(/```/g, "").trim() }; }
        else decision = { intent: "reply", text: raw.replace(/```/g, "").trim() };
      }

      if (decision.intent === "unknown") {
        return { reply: "No puedo ayudar con eso, solo manejo datos de ordenes, clientes y facturacion." };
      }

      if (decision.intent === "reply") {
        const kw = this.extractKeywords(message);
        if (kw.length && this.documentRepository) {
          const hit = await this.documentRepository.search(null, kw);
          if (hit) {
            const data = hit.data;
            const reply = hit.type === "faq"
              ? `${data.question}\n\n${data.answer}`
              : (data.title ? `${data.title}\n\n${data.content}` : data.content);
            return { reply, type: "document" };
          }
        }
        return { reply: decision.text || "OK", buttons: decision.buttons || null };
      }

      if (decision.intent === "continuation") {
        const ctx = this.chatContext.get();
        if (!ctx) {
          return { reply: "Aun no has consultado nada, preguntame por alguna orden o cliente." };
        }
        const reply = await this.generateReply(message, ctx.context, history);
        return { reply };
      }

      if (decision.intent === "document_query") {
        const result = await this.documentRepository.search(decision.category, decision.keywords);
        if (!result) {
          return { reply: "No encontre documentacion sobre ese tema." };
        }
        const data = result.data;
        let reply;
        if (result.type === "faq") {
          reply = `${data.question}\n\n${data.answer}`;
        } else {
          reply = data.title ? `${data.title}\n\n${data.content}` : data.content;
        }
        return { reply, type: "document" };
      }

      if (decision.intent === "query") {
        const error = this.validateQuery(decision.entity, decision.filters, decision.expand, decision.top);
        if (error) {
          return { reply: error };
        }
        let data = await this.odata.query(decision.entity, decision.filters, decision.expand, decision.top);
        if (decision.entity === "Orders") {
          data = await this.enrichOrderContext(data);
        }
        const context = this.buildContext(decision.entity, data);
        this.chatContext.set({ intent: decision.entity, id: (decision.filters && decision.filters[0] ? decision.filters[0].value : ""), context });
        const reply = await this.generateReply(message, context, history);
        return { reply, buttons: decision.buttons || null };
      }

      return { reply: "No entendi, puedes repetirlo?" };
    } catch (error) {
      console.error("=== ERROR ChatUseCase ===");
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
      if (error.response) console.error("Response data:", JSON.stringify(error.response.data).slice(0, 500));
      throw error;
    }
  }

  extractKeywords(message) {
    const STOP = new Set([
      "que", "como", "para", "por", "con", "una", "uno", "unos", "unas", "los", "las",
      "del", "de", "la", "el", "se", "no", "me", "ya", "su", "si", "lo", "en", "es",
      "un", "al", "y", "a", "o", "nos", "les", "mis", "tu", "como", "cual", "donde",
      "cuando", "quiero", "puedo", "ayudas", "ayuda", "hola", "gracias", "porque"
    ]);
    return (message.toLowerCase().match(/[a-zñáéíóúü]{4,}/g) || [])
      .filter((w) => !STOP.has(w));
  }

  async decideAction(message) {
    const schemaDesc = this.odata.getSchemaDescription();
    const last = this.chatContext.get()
      ? `Ultimo contexto consultado: ${this.chatContext.get().intent} (ID: ${this.chatContext.get().id})`
      : "No hay consulta previa.";

    const messages = [
      {
        role: "system",
        content:
          `Eres un planificador de consultas.\n\n` +
          `Northwind:\n${schemaDesc}\n\n` +
          `Documentacion disponible:\n` +
          `- Facturacion: registro de facturas, procesos de facturacion\n` +
          `- Proveedores: alta de proveedores, requisitos\n` +
          `- Pagos: plazos, medios de pago, procedimientos\n` +
          `- General: glosario, terminos financieros\n\n` +
          `${last}\n\n` +
          `Formato de respuesta SOLO JSON:\n` +
          `- Para consultar Northwind: {"intent":"query","entity":"...","filters":[{"field":"...","op":"eq","value":"..."}],"expand":["..."],"top":N}\n` +
          `- Para preguntas SOBRE PROCESOS, DOCUMENTACION O FAQ (ej: "como facturar", "registrar proveedor", "plazos de pago"): {"intent":"document_query","category":"Facturacion/Proveedores/Pagos/General","keywords":["factura","registro"]}\n` +
          `- Para responder tu mismo (saludos, analisis, opinion): {"intent":"reply","text":"..."}\n` +
          `- Cuando respondas datos de Northwind, sugiere 2-3 acciones de seguimiento en buttons:\n` +
          `   * Si mostraste un pedido: botones para "Ver cliente", "Ver factura", "Buscar otro pedido"\n` +
          `   * Si mostraste un cliente: botones para "Ver sus pedidos", "Buscar otro cliente"\n` +
          `   * Si es una factura: botones para "Ver pedido completo", "Buscar otra factura"\n` +
          `- Si toca ofrecer opciones al usuario, agrega buttons a reply o query: {"intent":"reply","text":"...","buttons":[{"label":"Sí","message":"sí quiero seguir"}]}\n` +
          `- Para continuar con lo ultimo consultado: {"intent":"continuation"}\n` +
          `- Fuera del alcance: {"intent":"unknown"}\n\n` +
          `NO inventes entidades, campos, operadores ni relaciones. Usa SOLO lo listado. Para documentacion, solo devuelve categoria y palabras clave, NO redactes la respuesta.`
      },
      { role: "user", content: message }
    ];
    return await this.llm.chatCompletion(messages, 0.1);
  }

  async generateReply(message, context, history) {
    const messages = [
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
      messages.push(...history.slice(-MAX_HISTORY));
    }
    messages.push({
      role: "user",
      content: `Mensaje: "${message}"\n\nDatos de Northwind:\n${context || "No hay datos."}\n\nResponde de forma natural.`
    });
    return await this.llm.chatCompletion(messages, 0.8);
  }

  validateQuery(entity, filters, expand, top) {
    const allowed = this.odata.getSchema()[entity];
    if (!allowed) return `Entidad no valida: ${entity}`;
    if (filters) {
      for (let i = 0; i < filters.length; i++) {
        const f = filters[i];
        if (!allowed.filters.includes(f.field)) return `Filtro no valido: ${f.field}`;
        if (f.op !== "eq") return `Operador no valido: ${f.op}`;
      }
    }
    if (expand) {
      for (let j = 0; j < expand.length; j++) {
        if (!allowed.expand.includes(expand[j])) return `Expand no valido: ${expand[j]}`;
      }
    }
    if (top && (top < 1 || top > allowed.maxTop)) return `Top fuera de rango (max ${allowed.maxTop})`;
    return null;
  }

  async enrichOrderContext(data) {
    if (!data || data.length === 0) return data;
    const o = data[0];
    o._total = this.odata.calcTotal(o.Order_Details);
    if (o.CustomerID && data.length < 2) {
      o._similarOrders = await this.odata.findSimilarOrders(o.CustomerID, o.OrderID);
    }
    return data;
  }

  buildContext(entity, data) {
    if (!data || data.length === 0) return "";
    if (entity === "Orders") {
      const o = data[0];
      const c = o.Customer || {};
      const details = o.Order_Details || [];
      const total = o._total || this.odata.calcTotal(details);
      const lines = [
        `Orden #${o.OrderID}`,
        `Cliente: ${c.CompanyName || o.CustomerID} (${c.ContactName || ""})`,
        `Fecha: ${o.OrderDate || "N/A"}`,
        `Envio: ${o.ShipName || ""}, ${o.ShipAddress || ""}, ${o.ShipCity || ""} ${o.ShipCountry || ""}`,
        `Total calculado: $${total.toFixed(2)}`,
        `Productos (${details.length}):`
      ];
      details.forEach((d) => {
        const subtotal = (d.Quantity * d.UnitPrice * (1 - (d.Discount || 0))).toFixed(2);
        lines.push(`  - Producto #${d.ProductID} x${d.Quantity} @ $${d.UnitPrice} = $${subtotal}`);
      });
      if (o._similarOrders && o._similarOrders.length > 0) {
        lines.push("Otras ordenes del mismo cliente:");
        o._similarOrders.forEach((s) => {
          lines.push(`  #${s.OrderID} - ${s.OrderDate || "N/A"} - Total: $${(s._total || 0).toFixed(2)}`);
        });
      }
      return lines.join("\n");
    }
    if (entity === "Customers") {
      const c = data[0];
      if (!c || !c.CustomerID) return "";
      const orders = c.Orders || [];
      return [
        `Cliente: ${c.CompanyName || ""}`,
        `Contacto: ${c.ContactName || ""}, ${c.ContactTitle || ""}`,
        `Direccion: ${c.Address || ""}, ${c.City || ""}, ${c.Country || ""}`,
        `Tel: ${c.Phone || ""}`,
        `Ordenes (${orders.length}):`
      ].concat(orders.slice(0, 10).map((o) =>
        `  #${o.OrderID} - ${o.OrderDate || "N/A"} $${o.Freight || 0}`
      )).join("\n");
    }
    if (entity === "Order_Details") {
      const items = data;
      const first = items[0];
      const order = first.Order || {};
      const granTotal = items.reduce((sum, d) =>
        sum + d.Quantity * parseFloat(d.UnitPrice) * (1 - (d.Discount || 0)), 0);
      return [
        `Facturacion - Orden #${order.OrderID || ""}`,
        `Fecha: ${order.OrderDate || "N/A"}`,
        `Cliente: ${order.CustomerID || ""}`,
        `Total: $${granTotal.toFixed(2)}`,
        "Lineas:"
      ].concat(items.map((d) => {
        const subtotal = (d.Quantity * d.UnitPrice * (1 - (d.Discount || 0))).toFixed(2);
        return `  - Producto #${d.ProductID} x${d.Quantity} @ $${d.UnitPrice} = $${subtotal}`;
      })).join("\n");
    }
    return JSON.stringify(data.slice(0, 5), null, 2);
  }
}

module.exports = { ChatUseCase };
