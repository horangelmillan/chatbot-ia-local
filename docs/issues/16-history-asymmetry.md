# Issue 16: El frontend envía 20 mensajes de historial pero `decideAction` no los usa

## Prioridad: 🟡 Grave

## Documentación afectada
- `docs/guides/containers.md` — línea 9: "Envía historial de últimos 20 mensajes en cada request"
- `docs/guides/mvp-overview.md` — línea 23: "Historial de últimos 20 mensajes"
- `docs/technical/01_arquitectura.md` — línea 82: "Envía historial de últimos 20 mensajes en cada request"
- `docs/technical/02_rendimiento.md` — línea 46: "Historial limitado a últimos 6 exchanges"

## Qué dice la documentación
Múltiples documentos afirman que el frontend envía el historial de los últimos 20 mensajes.

## Qué hace realmente el código
El frontend (`App.controller.js:67`) envía hasta 20 mensajes de historial:

```js
for (var i = Math.max(0, aItems.length - 20); i < aItems.length; i++) { ... }
```

Pero en el backend, ese historial solo se usa en `generateReply` (línea 199):

```js
if (history && Array.isArray(history)) {
  messages = messages.concat(history.slice(-6));
}
```

**`decideAction` nunca recibe el historial** — solo recibe el mensaje actual. La asimetría es:

| Función | Recibe historial? | Límite |
|---------|:-----------------:|:------:|
| `decideAction` (LLM clasifica) | ❌ No | Solo mensaje actual |
| `generateReply` (LLM responde) | ✅ Sí | Últimos 6 mensajes |

Además, el frontend envía 20 mensajes pero `generateReply` solo usa los últimos 6. Los 14 restantes se transmiten por la red sin ser utilizados.

## Propuesta de corrección

### Opción A: Reducir historial enviado a 6 en frontend
Cambiar `App.controller.js:67` de 20 a 6, y actualizar toda la documentación que menciona 20.

### Opción B: Pasar historial también a `decideAction`
Para dar contexto al clasificador (útil para `continuation`, por ejemplo):

```js
// chat.js, decideAction() — agregar history a los mensajes
messages: [
  { role: "system", content: "..." },
  ...(history || []).slice(-6),  // contexto de conversación
  { role: "user", content: message }
]
```

### Opción C: Documentar la asimetría
Actualizar la documentación para reflejar la realidad:
- Frontend envía: 20 mensajes
- `decideAction` recibe: solo el mensaje actual
- `generateReply` recibe: últimos 6 mensajes del historial

## Impacto del cambio

| Aspecto | Detalle |
|---------|---------|
| **Archivos a modificar** | Opción A: `frontend/webapp/controller/App.controller.js` + 4 docs. Opción B: `backend/routes/chat.js`. Opción C: 4 docs |
| **Riesgo** | Opción A: bajo. Opción B: medio (más tokens en decideAction, posible degradación). Opción C: bajo |
| **Dependencias** | Ninguna |
| **Verificación** | Opción A/B: verificar que el historial se mantiene correctamente en la conversación |

## Resolución

✅ Implementada **Opción A** con configurabilidad: frontend usa constante `MAX_HISTORY=6` en `App.controller.js`, backend usa env var `CHAT_HISTORY_LIMIT` (default 6) en `chat.js`. Documentado en `02_rendimiento.md` (sección Parámetros de Configuración). Actualizados docs: `mvp-overview.md`, `01_arquitectura.md`, `containers.md`. Cerrado en lote 2026-07-11.
