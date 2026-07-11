# Issue 07: `lastContext` es global, la documentación dice "por sesión"

## Prioridad: 🟠 Moderada

## Documentación afectada
- `docs/technical/04_cache_y_escalabilidad.md` — tabla "Estrategia de Caché" (línea 19): "Último contexto (lastContext) — Por sesión"
- `docs/guides/backend-rules.md` — menciona "Caché en memoria lastContext para continuación de conversación"
- `backend/routes/chat.js` — declaración y uso de `lastContext` (líneas 15, 49, 244, 276, 291)

## Qué dice la documentación
> Último contexto (lastContext) — Por sesión

Esto implica que cada usuario/sesión tiene su propio `lastContext` aislado.

## Qué hace realmente el código
En `chat.js`:

```js
let lastContext = null;  // variable global, línea 15
```

Es una variable **global** compartida por todos los requests. Si el Usuario A consulta la orden 10248 y luego el Usuario B dice "continuar", B obtendrá el contexto de A. Además:

- `lastContext` solo se actualiza en `intent: "query"` (línea 276)
- `lastContext` nunca se actualiza para `document_query`
- `lastContext` se resetea globalmente con `POST /api/chat/reset`

## Propuesta de corrección

### Opción A: Implementar cache por sesión
Usar un `Map` con clave de sesión (ej: cabecera `X-Session-ID` generada por el frontend y enviada en cada request):

```js
const sessionContexts = new Map();
// Almacenar: sessionContexts.set(sessionId, { intent, id, context })
// Recuperar: sessionContexts.get(sessionId)
// Reset: sessionContexts.delete(sessionId)
```

El frontend generaría un UUID al iniciar y lo enviaría en cada `POST /api/chat`.

### Opción B: Documentar la limitación actual
Cambiar la documentación a "Variable global compartida (no aislada por sesión)" y marcar como "mejora futura" la implementación por sesión.

## Impacto del cambio

| Aspecto | Detalle |
|---------|---------|
| **Archivos a modificar** | Opción A: `backend/routes/chat.js` + `frontend/webapp/controller/App.controller.js`. Opción B: `docs/technical/04_cache_y_escalabilidad.md` |
| **Riesgo** | Medio — Opción A cambia el contrato de la API (nueva cabecera). Opción B es solo docs |
| **Dependencias** | Ninguna |
| **Verificación** | Opción A: dos usuarios en paralelo, verificar que "continuar" use su propio contexto |
