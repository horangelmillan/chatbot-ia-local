# Ejercicios — Fase 02: Testing en Node.js

## Setup inicial

```bash
git checkout master
git checkout -b growth/fase-02-testing-nodejs

# Instalar Vitest
cd backend
pnpm add -D vitest
```

Agregar script en `backend/package.json`:

```json
"scripts": {
  "start": "node server.js",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

---

## Ejercicio 1: Exportar `app` desde server.js

**Archivo:** `backend/server.js`

Para poder testear con supertest, necesitas exportar `app` sin que `listen()` se ejecute en tests.

**Tarea:**

```javascript
// Modificar server.js al final:
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
  });
}
module.exports = app;
```

---

## Ejercicio 2: Test de InMemoryChatContext

**Crear:** `backend/src/features/chat/adapters/outbound/memory/__tests__/InMemoryChatContext.test.js`

**Lo que debe probar:**

```javascript
const context = require("../InMemoryChatContext");

// ✅ Test 1: get() devuelve null al inicio
expect(context.get()).toBeNull();

// ✅ Test 2: set() guarda y get() recupera
context.set({ intent: "Orders", id: "10248" });
expect(context.get()).toEqual({ intent: "Orders", id: "10248" });

// ✅ Test 3: reset() limpia
context.reset();
expect(context.get()).toBeNull();
```

**Objetivo:** Primer test que pasa. Es simple, es tu primer "verde".

---

## Ejercicio 3: Test de NorthwindODataAdapter.getSchema()

**Crear:** `backend/src/features/chat/adapters/outbound/northwind/__tests__/NorthwindODataAdapter.test.js`

**Lo que debe probar:**

```javascript
const adapter = require("../NorthwindODataAdapter");

// ✅ Test 1: getSchema() devuelve las 3 entidades esperadas
const schema = adapter.getSchema();
expect(schema).toHaveProperty("Orders");
expect(schema).toHaveProperty("Customers");
expect(schema).toHaveProperty("Order_Details");

// ✅ Test 2: Cada entidad tiene filters, expand y maxTop
expect(schema.Orders.filters).toContain("OrderID");
expect(schema.Orders.expand).toContain("Customer");

// ✅ Test 3: getSchemaDescription() incluye los nombres de las entidades
const desc = adapter.getSchemaDescription();
expect(desc).toContain("Orders");
expect(desc).toContain("Customers");
```

---

## Ejercicio 4: Test de ChatUseCase.execute() (el más importante)

**Crear:** `backend/src/features/chat/application/use-cases/__tests__/ChatUseCase.test.js`

**Escenarios a cubrir:**

```javascript
const { ChatUseCase } = require("../ChatUseCase");

// Test 1: Mensaje vacío → error
test("mensaje vacio devuelve error", async () => {
  const useCase = new ChatUseCase(null, null, null, null);
  const result = await useCase.execute({ message: "" });
  expect(result.reply).toBe("El mensaje no puede estar vacio.");
});

// Test 2: Intent "reply" → devuelve el texto
test("intent reply devuelve texto directo", async () => {
  const mockLlm = {
    chatCompletion: vi.fn().mockResolvedValue('{"intent":"reply","text":"Hola!"}')
  };
  const useCase = new ChatUseCase(mockLlm, null, null, null);
  const result = await useCase.execute({ message: "hola" });
  expect(result.reply).toBe("Hola!");
});

// Test 3: Intent "query" → llama a OData y generateReply
test("intent query ejecuta OData y genera respuesta", async () => {
  const mockLlm = {
    chatCompletion: vi.fn()
      .mockResolvedValueOnce('{"intent":"query","entity":"Orders","filters":[{"field":"OrderID","op":"eq","value":"10248"}]}')
      .mockResolvedValueOnce("La orden 10248 tiene un total de $500.")
  };
  const mockOdata = {
    query: vi.fn().mockResolvedValue([{ OrderID: 10248, Order_Details: [], Customer: {} }]),
    getSchema: vi.fn().mockReturnValue({ Orders: { filters: ["OrderID"], expand: [], maxTop: 50 } }),
    getSchemaDescription: vi.fn().mockReturnValue("Orders"),
    calcTotal: vi.fn().mockReturnValue(500),
    findSimilarOrders: vi.fn().mockResolvedValue([])
  };
  const mockRepo = { search: vi.fn() };
  const mockContext = { get: vi.fn().mockReturnValue(null), set: vi.fn(), reset: vi.fn() };

  const useCase = new ChatUseCase(mockLlm, mockOdata, mockRepo, mockContext);
  const result = await useCase.execute({ message: "dame la orden 10248" });

  expect(result.reply).toBe("La orden 10248 tiene un total de $500.");
  expect(mockLlm.chatCompletion).toHaveBeenCalledTimes(2); // decideAction + generateReply
  expect(mockOdata.query).toHaveBeenCalledWith("Orders", expect.any(Array), undefined, undefined);
});

// Test 4: Intent "document_query" → busca en repositorio
test("intent document_query busca en documentos", async () => {
  const mockLlm = {
    chatCompletion: vi.fn().mockResolvedValue('{"intent":"document_query","category":"Facturacion","keywords":["factura"]}')
  };
  const mockRepo = {
    search: vi.fn().mockResolvedValue({ type: "faq", data: { question: "Como facturar?", answer: "Para facturar..." } })
  };
  const useCase = new ChatUseCase(mockLlm, null, mockRepo, null);
  const result = await useCase.execute({ message: "como facturo?" });

  expect(result.reply).toContain("Como facturar?");
  expect(result.type).toBe("document");
});

// Test 5: Intent "unknown" → mensaje de fuera de alcance
test("intent unknown rechaza la consulta", async () => {
  const mockLlm = {
    chatCompletion: vi.fn().mockResolvedValue('{"intent":"unknown"}')
  };
  const useCase = new ChatUseCase(mockLlm, null, null, null);
  const result = await useCase.execute({ message: "que hora es?" });
  expect(result.reply).toContain("No puedo ayudar");
});

// Test 6: Intent "continuation" sin contexto → error
test("continuation sin contexto previo devuelve error", async () => {
  const mockLlm = {
    chatCompletion: vi.fn().mockResolvedValue('{"intent":"continuation"}')
  };
  const mockContext = { get: vi.fn().mockReturnValue(null) };
  const useCase = new ChatUseCase(mockLlm, null, null, mockContext);
  const result = await useCase.execute({ message: "sigue" });
  expect(result.reply).toContain("Aun no has consultado nada");
});
```

---

## Ejercicio 5: Test HTTP con Supertest

**Instalar:**

```bash
pnpm add -D supertest
```

**Crear:** `backend/routes/__tests__/chat.test.js`

```javascript
const request = require("supertest");
const app = require("../../server");

test("POST /api/chat con mensaje vacio devuelve 400", async () => {
  await request(app)
    .post("/api/chat")
    .send({ message: "" })
    .expect(400)
    .expect((res) => {
      expect(res.body.reply).toBe("El mensaje no puede estar vacio.");
    });
});

test("POST /api/chat con mensaje valido devuelve 200", async () => {
  await request(app)
    .post("/api/chat")
    .send({ message: "hola" })
    .expect(200)
    .expect((res) => {
      expect(res.body).toHaveProperty("reply");
    });
});
```

**Nota**: Estos tests son lentos porque llaman al LLM real. En el futuro, cuando el ChatUseCase sea inyectable, estos tests usarán mocks. Por ahora, prueban la integración real.

---

## Ejercicio 6: Ejecutar todos los tests

```bash
cd backend
pnpm test
```

**Ver:** que los tests corren y pasan.

---

## Resumen de commits recomendados

```bash
git commit -m "config: agregar vitest y script de test"
git commit -m "feat(server): exportar app, no listen en modo test"
git commit -m "test: InMemoryChatContext get/set/reset"
git commit -m "test: NorthwindODataAdapter schema y descripcion"
git commit -m "test: ChatUseCase con mocks (6 escenarios)"
git commit -m "test: endpoint POST /api/chat con supertest"
git commit -m "docs(growth): marcar checklist fase 2"
```
