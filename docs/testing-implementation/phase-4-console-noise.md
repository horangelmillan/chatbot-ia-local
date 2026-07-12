# Fase 4: Silent Tests — Eliminar ruido en consola

> Prioridad: 🟡 Alta | Esfuerzo: 1-2h | Dependencias: Ninguna

## Contexto

Durante la ejecución de tests, aparecen estos mensajes no deseados en stdout:

1. **Logs de LLM**: `console.log("=== RAW LLM ===", ...)` desde `ChatUseCase.js` cuando se depura la respuesta de LM Studio
2. **Errores de parseo**: `console.error("JSON parse error:...")` también de `ChatUseCase.js`
3. **Schema errors silenciados**: `.catch(() => {})` en `vitest.setup.js` esconde errores reales de migración

En CI, esto entierra señales de fallos reales y hace que revisar logs de CI sea frustrante.

## Diagnóstico

```bash
cd backend && pnpm vitest run 2>&1 | grep -E "(RAW LLM|JSON parse|console.error)"
```

Localizar las líneas exactas en `ChatUseCase.js` que producen estos logs.

## Solución

### 1. Silenciar logs en el setup global de tests

En `backend/vitest.setup.js`:

```js
beforeAll(async () => {
  // Silenciar logs de LLM y parse errors durante tests
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});

  setupPool = new Pool({ connectionString: TEST_DB_URL });
  await setupPool.query(schema).catch(() => {});
});

afterAll(async () => {
  // Restaurar console para otros reportes
  vi.restoreAllMocks();
  if (setupPool) await setupPool.end();
});
```

**Nota:** Si algún test necesita verificar console output, puede hacer `vi.mocked(console.log).mock.calls` sin problema, porque `vi.spyOn` mantiene el registro de llamadas.

### 2. Alternativa: logger condicional (menos intrusivo)

Si se prefiere no silenciar todo el console globalmente, modificar `ChatUseCase.js`:

```js
const DEBUG = process.env.NODE_ENV !== "test";

function enrichOrderContext(order, queryResult) {
  if (DEBUG) console.log("=== RAW LLM ===", llmResponse);
  // ...
}
```

### 3. Schema errors: reemplazar catch silencioso

En `vitest.setup.js`, cambiar:

```js
// Antes:
await setupPool.query(schema).catch(() => {});

// Despues:
await setupPool.query(schema).catch((err) => {
  console.warn("Schema setup warning (non-fatal):", err.message);
});
```

### 4. Tests específicos que verifican console output (opcional)

Si se quiere verificar que ciertos logs se producen en runtime pero no en tests:

```js
test("error de parseo se loggea", async () => {
  const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const mockLlm = {
    chatCompletion: vi.fn().mockResolvedValue("{json invalido")
  };
  const useCase = new ChatUseCase(mockLlm, null, null, null);
  
  // Ejecutar accion que produce el log
  const result = await useCase.execute({ message: "test" });
  expect(result.reply).toBeDefined();
  expect(consoleSpy).toHaveBeenCalled();
  
  consoleSpy.mockRestore();
});
```

## Archivos a modificar

| Archivo | Acción |
|---------|--------|
| `backend/vitest.setup.js` | Agregar `vi.spyOn(console, "log/error")` en beforeAll/afterAll |
| `backend/vitest.setup.js` | Reemplazar `.catch(() => {})` con `console.warn` |
| `backend/src/features/chat/application/use-cases/ChatUseCase.js` | Opcional — agregar guard `process.env.NODE_ENV !== "test"` |

## Riesgos

- Si un test usa `vi.spyOn(console, "log")` después del setup, el spy global puede interferir. Solución: llamar `vi.restoreAllMocks()` antes de ese test.
- `vi.restoreAllMocks()` en `afterAll` del setup es seguro porque Vitest restaura entre suites automáticamente.

## Checklist

- [x] Agregar `vi.spyOn(console, "log").mockImplementation(() => {})` en vitest.setup.js
- [x] Agregar `vi.spyOn(console, "error").mockImplementation(() => {})` en vitest.setup.js
- [x] Reemplazar `.catch(() => {})` con `console.warn`
- [x] Verificar: `pnpm test:backend` sin ruido de RAW LLM/JSON parse
- [x] Verificar: `pnpm test:backend:coverage` sigue funcionando
- [ ] Opcional: agregar test de console.error con spy

## Criterios de aceptación

- `cd backend && pnpm vitest run 2>&1 | grep -E "RAW LLM|JSON parse"` no produce salida
- Los tests existentes siguen pasando
- Si un schema falla, aparece un `console.warn` con el mensaje de error (en vez de silencio total)
