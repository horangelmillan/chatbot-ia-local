# Fase 7: Migraciones Técnicas de Testing

> Prioridad: 🔵 Media | Esfuerzo: 3-4h | Dependencias: Fases 1-6 completadas

## Contexto

El proyecto tiene tres deudas técnicas que afectan el ecosistema de testing a largo plazo:

1. **Karma es legacy**: `karma-ui5` funciona pero el estándar actual de UI5 Tooling es `ui5-test-runner`, que además soporta coverage Istanbul nativamente.
2. **CJS + `vi.mock`**: Vitest tiene soporte limitado de `vi.mock` con CommonJS. Los tests de rutas usan `require.cache` hacking en vez de `vi.mock()`, que es frágil y menos idiomático.
3. **Sin separación unit/integration**: `pnpm test` corre todo junto. No hay forma de ejecutar solo tests rápidos (unit) o solo tests lentos (DB real, HTTP).

## Diagnóstico

```bash
# Dependencias actuales
cd frontend && cat package.json | grep -A2 karma
# karma: ^6.4.4, karma-chrome-launcher, karma-ui5

# CJS vs ESM
cd backend && head -5 server.js
# const express = require("express");  <-- CJS
```

## Solución

### 1. Migrar Karma → ui5-test-runner

**Instalación:**

```bash
cd frontend && pnpm add -D ui5-test-runner
pnpm remove karma karma-chrome-launcher karma-ui5
```

**Configuración:**

Crear `frontend/ui5-test-runner.yaml` (o usar `package.json` scripts):

```json
{
  "scripts": {
    "test": "ui5-test-runner --url http://localhost:8080/test/testsuite.qunit.js --coverage",
    "test:ci": "ui5-test-runner --url http://localhost:8080/test/testsuite.qunit.js --coverage --reporter junit"
  }
}
```

**Ventajas:**
- Coverage Istanbul nativo (reportes de cobertura frontend)
- Sin dependencia de ChromeHeadless (usa el navegador headless de Node)
- Integración más directa con UI5 Tooling
- Sin necesidad de karma.conf.js

**Eliminar:**

- `frontend/karma.conf.js` (ya no necesario)
- Dependencias karma de `frontend/package.json`

### 2. Evaluar ESM para imports de ruta

El problema actual: `vi.mock("axios")` no funciona bien con CJS porque `require.cache` es mutable y Vitest no puede interceptar `require` como sí hace con `import` de ESM.

**Solución parcial (sin cambiar todo a ESM):**

Renombrar `server.js` → `server.cjs` (CJS explícito) y crear un wrapper ESM:

```js
// server.mjs — wrapper ESM
import app from './server.cjs';
export default app;
```

Luego en tests:

```js
vi.mock("axios", () => ({
  post: vi.fn().mockResolvedValue({ data: { choices: [...] } })
}));
```

Alternativa más simple: mantener `require.cache` (funciona, solo es menos idiomático).

### 3. Separar test:unit y test:integration

En `backend/package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:unit": "vitest run --exclude '**/__tests__/*Repository*' --exclude '**/__tests__/*Indexer*'",
    "test:integration": "vitest run --include '**/__tests__/*Repository*' --include '**/__tests__/*Indexer*'"
  }
}
```

Y en `routes/__tests__/chat.test.js` y `documents.test.js` — estos tests usan supertest (HTTP) y mocks, no DB real, así que son "unit" de la capa HTTP. Deben incluirse en `test:unit`.

Para `root/package.json`:

```json
{
  "scripts": {
    "test:unit": "concurrently \"pnpm test:unit:backend\" \"pnpm test:frontend\"",
    "test:unit:backend": "cd backend && pnpm vitest run --exclude '**/__tests__/*Repository*' --exclude '**/__tests__/*Indexer*'",
    "test:integration": "cd backend && pnpm vitest run --include '**/__tests__/*Repository*' --include '**/__tests__/*Indexer*'"
  }
}
```

### 4. Credenciales hardcodeadas

En `backend/vitest.setup.js`, cambiar:

```js
const TEST_DB_URL = process.env.DATABASE_URL_TEST;

if (!TEST_DB_URL) {
  throw new Error(
    "DATABASE_URL_TEST no configurada. " +
    "Crea un archivo .env.test con DATABASE_URL_TEST=postgresql://..."
  );
}
```

En lugar del fallback con credenciales hardcodeadas:

```js
// ANTES (inseguro):
const TEST_DB_URL = process.env.DATABASE_URL_TEST || "postgresql://chatbot_user:chatbot_pass_2026@localhost:5432/chatbot_rag_test";

// DESPUES (segun):
const TEST_DB_URL = process.env.DATABASE_URL_TEST;
if (!TEST_DB_URL) throw new Error("DATABASE_URL_TEST no configurada");
```

## Archivos a modificar/crear

| Archivo | Acción |
|---------|--------|
| `frontend/package.json` | Reemplazar karma → ui5-test-runner |
| `frontend/karma.conf.js` | Eliminar (opcional, mantener como backup) |
| `backend/package.json` | Agregar scripts `test:unit` y `test:integration` |
| `root/package.json` | Agregar scripts `test:unit` y `test:integration` |
| `backend/vitest.setup.js` | Eliminar fallback de credenciales hardcodeadas |

## Riesgos

- **ui5-test-runner**: puede no ser compatible con todas las features de SAPUI5 que usa el proyecto. Verificar con `pnpm test` después de la migración.
- **ESM wrapper**: puede introducir problemas si otras partes del proyecto dependen de `require("./server")`. Evaluar antes de implementar.
- **Separación unit/integration**: los tests de rutas (HTTP mockeado) son unitarios, pero los de DB (PostgresRepository) son integración. La separación por nombre de archivo es frágil si se agregan nuevos tests. Mejor usar etiquetas Vitest: `test.concurrent` o `test.tags`.

## Checklist

- [ ] Instalar `ui5-test-runner` en frontend y verificar que `pnpm test` pasa
- [ ] Eliminar dependencias karma de `frontend/package.json`
- [ ] Agregar `test:unit` y `test:integration` en `backend/package.json`
- [ ] Agregar `test:unit` y `test:integration` en `root/package.json`
- [ ] Eliminar credenciales hardcodeadas de `vitest.setup.js`
- [ ] Verificar: `pnpm test:unit` corre solo tests rápidos
- [ ] Verificar: `pnpm test:integration` corre solo tests de DB/HTTP real
- [ ] Verificar: `pnpm test` sigue corriendo todo

## Criterios de aceptación

- `pnpm test` en raíz corre backend + frontend y pasa
- `pnpm test:unit` corre en <5s (solo tests rápidos)
- `pnpm test:integration` corre tests de DB real
- Credenciales hardcodeadas eliminadas; falla con error claro si no hay env var
- ui5-test-runner genera reporte de cobertura frontend (opcional)
