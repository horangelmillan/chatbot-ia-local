# Issue 10: MVP overview omite el intent `continuation`

## Prioridad: 🟡 Grave

## Documentación afectada
- `docs/guides/mvp-overview.md` — lista de intents (líneas 33-34)
- `docs/guides/backend-rules.md` — tabla de intents (líneas 22-30)

## Qué dice la documentación
`mvp-overview.md` (línea 33):
> `decideAction` (temp 0.1): clasifica consultas: **query, document_query, reply, unknown**

Falta `continuation`.

`backend-rules.md` (líneas 24-29) SÍ incluye `continuation` en la tabla de intents:
> | `continuation` | Continuar con el último contexto consultado |

Sin embargo, en la sección de flujo (líneas 33-51), el desglose por intent solo cubre `query`, `document_query`, `reply` y `unknown`, omitiendo `continuation`.

## Qué hace realmente el código
`chat.js` (líneas 243-249) maneja `continuation`:

```js
if (decision.intent === "continuation") {
  if (!lastContext) {
    return res.json({ reply: "Aun no has consultado nada, preguntame por alguna orden o cliente." });
  }
  var reply = await generateReply(message, lastContext.context, history);
  return res.json({ reply: reply });
}
```

El prompt de `decideAction` (línea 69) también incluye instrucciones para `continuation`:
```
'- Para continuar con lo ultimo consultado: {"intent":"continuation"}\n'
```

## Propuesta de corrección
Agregar `continuation` a:

1. **`mvp-overview.md`**: lista de intents → `query, document_query, reply, continuation, unknown`
2. **`backend-rules.md`**: sección de flujo → agregar sub-sección para `continuation` explicando que usa `lastContext` para recuperar el último contexto consultado y lo envía a `generateReply`

## Impacto del cambio

| Aspecto | Detalle |
|---------|---------|
| **Archivos a modificar** | `docs/guides/mvp-overview.md`, `docs/guides/backend-rules.md` |
| **Riesgo** | Bajo — solo documentación |
| **Dependencias** | Issue 07 (lastContext) para entender bien el comportamiento actual |
| **Verificación** | Revisión visual |

## Resolución

✅ Agregado `continuation` a la lista de intents en `mvp-overview.md` línea 33. Actualizada referencia de historial de 20→6 mensajes (Issue 16). Cerrado en lote 2026-07-11.
