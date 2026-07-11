# Issue 12: `backend-rules.md` no documenta el paso `enrichOrderContext`

## Prioridad: 🟡 Grave

## Documentación afectada
- `docs/guides/backend-rules.md` — flujo del intent `query` (líneas 33-38)
- `docs/diagrams/sequences/chat-flow.md` — diagrama de secuencia (línea 22)

## Qué dice la documentación
El flujo `query` según `backend-rules.md`:
1. Validar entidad, filtros y expand contra schema definido
2. Ejecutar consulta OData
3. Formatear datos
4. Enviar al LLM para generar respuesta natural
5. Devolver `{ reply, buttons? }`

El diagrama de secuencia (`chat-flow.md`) SÍ muestra el paso `enrichOrderContext(data)` y `buildContext(entity, data)`.

## Qué hace realmente el código
En `chat.js`, el flujo real incluye dos pasos adicionales que la documentación de backend-rules omite:

**Paso 2.5: `enrichOrderContext(data)`** (líneas 102-122)
- Calcula totales de la orden (`calcTotal`)
- Busca órdenes similares del mismo cliente
- Solo se ejecuta para entidad `Orders`

**Paso 3: `buildContext(entity, data)`** (líneas 124-184)
- Formatea datos en texto plano estructurado
- Maneja 3 entidades: `Orders`, `Customers`, `Order_Details`
- Incluye totales calculados, productos y órdenes similares

El código ejecuta:
```js
// chat.js líneas 271-277
var data = await queryNorthwind(decision.entity, ...);
if (decision.entity === "Orders") {
  data = await enrichOrderContext(data);     // ← no documentado
}
var context = buildContext(decision.entity, data);  // ← no documentado como paso
lastContext = { ... };
var reply = await generateReply(message, context, history);
```

## Propuesta de corrección
Actualizar `backend-rules.md` flujo `query` para incluir:

1. Validar entidad, filtros y expand contra schema definido
2. Ejecutar consulta OData
3. **Enriquecer contexto** (si es Orders: calcular totales + buscar órdenes similares)
4. **Formatear datos en contexto legible** (`buildContext`)
5. Enviar al LLM para generar respuesta natural
6. **Actualizar `lastContext`** con la entidad consultada
7. Devolver `{ reply, buttons? }`

## Impacto del cambio

| Aspecto | Detalle |
|---------|---------|
| **Archivos a modificar** | `docs/guides/backend-rules.md` |
| **Riesgo** | Bajo — solo documentación |
| **Dependencias** | Ninguna |
| **Verificación** | Revisión visual de que coincida con `chat-flow.md` |
