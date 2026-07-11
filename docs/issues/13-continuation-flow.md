# Issue 13: Intent `continuation` listado en tabla pero no descrito en el flujo

## Prioridad: 🟡 Grave

## Documentación afectada
- `docs/guides/backend-rules.md` — tabla de intents (líneas 22-30) y sección de flujo (líneas 31-51)

## Qué dice la documentación
La tabla de intents incluye `continuation`:

| Intent | Descripción |
|--------|-------------|
| `continuation` | Continuar con el último contexto consultado |

Pero el desglose del flujo (líneas 33-51) solo describe qué hacer para `query`, `document_query`, `reply` y `unknown`. No hay sub-sección para `continuation`.

## Qué hace realmente el código
`chat.js` (líneas 243-249) maneja `continuation` así:

```js
if (decision.intent === "continuation") {
  if (!lastContext) {
    return res.json({ reply: "Aun no has consultado nada..." });
  }
  var reply = await generateReply(message, lastContext.context, history);
  return res.json({ reply: reply });
}
```

Flujo real:
1. Verificar que `lastContext` no sea null (si es null, responder que no hay consulta previa)
2. Enviar el mensaje actual + `lastContext.context` + historial a `generateReply`
3. Devolver la respuesta generada

## Propuesta de corrección
Agregar sub-sección para `continuation` en el flujo documentado:

### continuation
- Verificar que exista un contexto previo (`lastContext`)
- Si no existe, responder indicando que aún no se ha consultado nada
- Si existe, enviar el mensaje + contexto previo al LLM (`generateReply`)
- Devolver la respuesta

## Impacto del cambio

| Aspecto | Detalle |
|---------|---------|
| **Archivos a modificar** | `docs/guides/backend-rules.md` |
| **Riesgo** | Bajo — solo documentación |
| **Dependencias** | Issue 07 (lastContext) e Issue 10 (mvp intents) para consistencia completa |
| **Verificación** | Revisión visual |

## Resolución

✅ Agregada sub-sección `### continuation` en `backend-rules.md` con el flujo completo. Cerrado en lote 2026-07-11.
