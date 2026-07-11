# Issue 04: Cola de requests al LLM documentada no implementada

## Prioridad: 🟠 Moderada

## Documentación afectada
- `docs/technical/04_cache_y_escalabilidad.md` — sección "Límite de Concurrencia" (líneas 68-80)

## Qué dice la documentación
> LM Studio (y Ollama, vLLM, etc.) procesan **1 request a la vez** por modelo.
>
> Solución: **Cola de requests** implementada en backend:
>
> ```
> Request A ──▶ Cola ──▶ LLM ──▶ Respuesta A
> Request B ──▶      │       └──▶ Respuesta B
> Request C ──▶      └──────────▶ Respuesta C
> ```
>
> Con cola y response time de 3s, el sistema soporta picos de ~20 requests/minuto sin error.

## Qué hace realmente el código
En `backend/routes/chat.js`, las llamadas a LM Studio se hacen directamente mediante `axios.post(LM_URL, ...)` sin ningún mecanismo de cola, semáforo o limitación de concurrencia:

- `decideAction()` — línea 50: `await axios.post(LM_URL, {...})`
- `generateReply()` — línea 208: `await axios.post(LM_URL, {...})`

Si dos usuarios envían consultas simultáneas, ambas llamadas axios se ejecutarán en paralelo. LM Studio, al ser un servidor single-thread para inferencia, probablemente encolará internamente, pero esto no está controlado por el backend — el backend podría saturarse con múltiples requests simultáneas sin visibilidad del estado de la cola.

## Propuesta de corrección

### Opción A: Implementar cola simple
Agregar un semáforo/cola en `chat.js` o en un módulo separado (`backend/db/llm-queue.js`):

```js
// cola simple: procesa un request a la vez
const queue = [];
let processing = false;

async function enqueue(fn) {
  return new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject });
    processQueue();
  });
}

async function processQueue() {
  if (processing || queue.length === 0) return;
  processing = true;
  const { fn, resolve, reject } = queue.shift();
  try {
    resolve(await fn());
  } catch (e) {
    reject(e);
  } finally {
    processing = false;
    processQueue();
  }
}
```

### Opción B: Eliminar la documentación de la cola
Si se considera que LM Studio maneja correctamente la concurrencia por sí solo (versiones recientes lo hacen), eliminar la sección del documento técnico.

## Impacto del cambio

| Aspecto | Detalle |
|---------|---------|
| **Archivos a modificar** | Opción A: `backend/routes/chat.js` (o nuevo `backend/db/llm-queue.js`). Opción B: `docs/technical/04_cache_y_escalabilidad.md` |
| **Riesgo** | Medio — una cola mal implementada puede introducir deadlocks o timeouts |
| **Dependencias** | Ninguna |
| **Verificación** | Enviar 3 consultas simultáneas y verificar que se procesan secuencialmente |
