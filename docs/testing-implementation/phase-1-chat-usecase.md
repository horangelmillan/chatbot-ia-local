# Fase 1: ChatUseCase — Cobertura de branches al 100%

> Prioridad: 🔴 Crítico | Esfuerzo: 2-3h | Dependencias: Ninguna

## Contexto

`ChatUseCase.execute()` es el núcleo del chatbot. Recibe un mensaje del usuario, lo envía a LM Studio, parsea el intent (reply/query/document_query/continuation/unknown) y ejecuta la acción correspondiente. Actualmente tiene **69% de branch coverage** porque dos métodos auxiliares no están cubiertos:

- `enrichOrderContext(order, details)` (líneas ~91-193)
- `buildContext(context, queryResult)` (líneas ~198-229)

## Diagnóstico

```bash
# Ver cobertura actual
cd backend && pnpm vitest run --coverage
```

Las líneas no cubiertas corresponden a:

1. **`enrichOrderContext`**: enriquece una orden con datos del cliente y calcula totales con/sin descuento. Ramas: order sin Customer, Order_Details vacío, múltiples detalles con descuento, sin descuento.
2. **`buildContext`**: reconstruye el contexto de conversación desde `InMemoryChatContext`. Ramas: contexto nulo, contexto sin intent, contexto con diferentes entidades (Orders, Customers).

## Solución

### 1. Tests para `enrichOrderContext`

Agregar al final de `ChatUseCase.test.js`:

```js
describe("enrichOrderContext", () => {
  test("enriquece orden con Customer y Order_Details con descuento", async () => { /* ... */ });
  test("enriquece orden sin Customer (Customer null)", async () => { /* ... */ });
  test("enriquece orden con Order_Details vacio", async () => { /* ... */ });
  test("enriquece orden con descuento parcial en algunos items", async () => { /* ... */ });
  test("calcTotal con null devuelve 0", async () => { /* ... */ }); // ya existe, verificar
});
```

**Patrón:**

```js
test("enriquece orden con Customer y Order_Details con descuento", async () => {
  const mockOdata = mockOdataBase();
  mockOdata.query
    .mockResolvedValueOnce([{
      OrderID: 10248, CustomerID: "ALFKI",
      Customer: { CompanyName: "Alfreds", Country: "Germany" },
      Order_Details: [
        { Quantity: 3, UnitPrice: "15.50", Discount: 0.1 },
        { Quantity: 2, UnitPrice: "10.00", Discount: 0 }
      ]
    }])
    .mockResolvedValueOnce([]); // findSimilarOrders sin resultados

  const useCase = new ChatUseCase(null, mockOdata, null, mockContextBase());
  const enriched = await useCase.enrichOrderContext(
    { OrderID: 10248, intent: "Orders", id: "10248" },
    { data: { OrderID: 10248, CustomerID: "ALFKI" } }
  );

  expect(mockOdata.query).toHaveBeenCalledWith("Orders", ...);
  expect(enriched).toMatchObject({
    orderId: 10248,
    customer: { name: "Alfreds" },
    total: 41.85
  });
});
```

### 2. Tests para `buildContext`

```js
describe("buildContext", () => {
  test("contexto nulo devuelve cadena vacia", async () => {
    const context = mockContextBase();
    context.get.mockReturnValue(null);
    const useCase = new ChatUseCase(mockLlm, mockOdataBase(), null, context);
    const result = await useCase.execute({ message: "continuar" });
    expect(result.reply).toContain("Aun no has consultado nada");
  });

  test("contexto con intent Orders genera mensaje de continuacion", async () => {
    const mockLlm = {
      chatCompletion: vi.fn()
        .mockResolvedValueOnce('{"intent":"continuation"}')
        .mockResolvedValueOnce("Respuesta sobre la orden 10248")
    };
    const mockContext = mockContextBase();
    mockContext.get.mockReturnValue({
      intent: "Orders",
      id: "10248",
      context: { OrderID: 10248 }
    });
    const useCase = new ChatUseCase(mockLlm, mockOdataBase(), null, mockContext);
    const result = await useCase.execute({ message: "dime mas" });
    expect(result.reply).toBe("Respuesta sobre la orden 10248");
  });
});
```

### 3. Edge cases de parseo JSON

Ya existen tests para JSON malformado (texto plano) y triple backtick. Agregar:

```js
test("JSON con campos extra no rompe el parseo", async () => { /* ... */ });
test("JSON array en vez de objeto usa fallback", async () => { /* ... */ });
test("JSON con intent valido pero campos faltantes", async () => { /* ... */ });
```

## Archivos a modificar

| Archivo | Acción |
|---------|--------|
| `backend/src/features/chat/application/use-cases/__tests__/ChatUseCase.test.js` | Agregar ~90 líneas de tests nuevos |

## Checklist

- [x] Test: `enrichOrderContext` con Customer null
- [x] Test: `enrichOrderContext` con Order_Details vacío
- [x] Test: `enrichOrderContext` con descuento parcial
- [x] Test: `enrichOrderContext` con findSimilarOrders con resultados
- [x] Test: `buildContext` con contexto null
- [x] Test: `buildContext` con intent Orders (con y sin similarOrders)
- [x] Test: `buildContext` con intent Customers (con/sin CustomerID, Orders, CompanyName)
- [x] Test: JSON con campos extra
- [x] Test: JSON array en vez de objeto
- [x] Verificar: `pnpm test:backend` pasa
- [x] Verificar: cobertura de ChatUseCase branches ≥ 95% (96.71%)

## Criterios de aceptación

- `cd backend && pnpm vitest run --coverage` muestra ChatUseCase con >90% branches cubiertas (ideal 100%)
- Todos los tests existentes siguen pasando
- No se modificó `ChatUseCase.js` (solo tests)
