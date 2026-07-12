# Fase 03: Express en Producción

## Objetivo

Eliminar las debilidades críticas del servidor Express: manejo de errores global, validación en el adapter (no en el use case), errores tipados, y un handler wrapper que capture errores asíncronos automáticamente.

## ¿Por qué es importante?

Si el LLM responde con un JSON inválido, o la BD se cae, o un request llega mal formado, Express responde con HTML genérico por defecto. Un backend de producción debe responder JSON siempre, con el status code correcto.

## Conceptos a dominar

| Concepto | Por qué |
|----------|---------|
| Error middleware Express | Capturar errores no manejados y devolver JSON |
| asyncHandler wrapper | No repetir try/catch en cada ruta |
| Errores tipados | NotFoundError, ValidationError con status code |
| Validación en adapter | Separar validación de entrada de la lógica de negocio |

## Archivos a modificar/crear

- `backend/src/shared/errors.js` — errores tipados (crear)
- `backend/src/shared/adapters/inbound/http/asyncHandler.js` — wrapper (crear)
- `backend/server.js` — error middleware
- `backend/routes/chat.js` — asyncHandler + validación
- `backend/routes/documents.js` — asyncHandler + validación

## Tiempo: ~1 semana
