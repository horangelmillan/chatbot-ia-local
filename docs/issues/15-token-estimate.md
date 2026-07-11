# Issue 15: Estimación de tokens del system prompt incorrecta (~80 vs ~400-500)

## Prioridad: 🟡 Grave

## Documentación afectada
- `docs/technical/02_rendimiento.md` — tabla "Optimizaciones Implementadas" (línea 47): "System prompt corto (~80 tokens)"

## Qué dice la documentación
> System prompt corto (~80 tokens) — Reduce primera llamada

## Qué hace realmente el código
El system prompt de `decideAction` en `chat.js` (líneas 55-71):

```
"Eres un planificador de consultas.\n\n" +
"Northwind:\n" + schemaDesc + "\n\n" +
"Documentacion disponible:\n" + DOC_CATEGORIES.join(", ") + "\n\n" +
last + "\n\n" +
"Formato de respuesta SOLO JSON:\n" +
"- Para consultar Northwind: ..." +
"- Para responder tu mismo ..." +
"- Para preguntas sobre procesos internos ..." +
"- Cuando respondas datos de Northwind ..." +
"- Si toca ofrecer opciones ..." +
"- Para continuar con lo ultimo consultado ..." +
"- Fuera del alcance ..." +
"NO inventes entidades..."
```

Estimación real (contando tokens ~1.3x palabras):
- Texto fijo: ~250 palabras ≈ ~325 tokens
- `schemaDesc`: variable, ~100-150 palabras ≈ ~130-195 tokens  
- `DOC_CATEGORIES`: variable, ~10 palabras ≈ ~13 tokens
- `last`: variable, ~20 palabras ≈ ~26 tokens
- **Total real: ~500-560 tokens** — muy lejos de los ~80 tokens documentados

El system prompt de `generateReply` (líneas 190-196) es más corto (~60 tokens) pero la documentación referencia `decideAction`.

## Propuesta de corrección
Actualizar `02_rendimiento.md`:

- Cambiar "System prompt corto (~80 tokens)" a "System prompt decideAction (~500 tokens)"
- Si se desea optimizar, el prompt podría reducirse moviendo las reglas de formato a un esquema más compacto

## Impacto del cambio

| Aspecto | Detalle |
|---------|---------|
| **Archivos a modificar** | `docs/technical/02_rendimiento.md` |
| **Riesgo** | Bajo — solo corrección de estimación |
| **Dependencias** | Ninguna |
| **Verificación** | Revisión visual. Opcional: contar tokens reales con un tokenizador |

## Resolución

✅ Corregida estimación en `02_rendimiento.md`: `~80 tokens` → `~500 tokens`. Cerrado en lote 2026-07-11.
