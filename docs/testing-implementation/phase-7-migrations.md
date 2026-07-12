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

## Estado de implementación (2026-07)

Se implementaron los **4 ítems**. El ítem **1 (Karma → ui5-test-runner)** se **migró y validó**
(17/17, `EXIT=0`) antes de eliminar Karma, según el gate acordado "migrar y validar primero".

### Ítem 4 — Credenciales hardcodeadas ✅
`backend/vitest.setup.js` ya no tiene fallback con credenciales. El setup carga
`backend/.env.test` (gitignored) vía `dotenv` y lee `DATABASE_URL_TEST`; si no está
definida (ni en el entorno ni en `.env.test`), lanza un error claro.

- `backend/.env.test` — creds de la BD de prueba, **gitignored** (no se commitea).
- `backend/.env.test.example` — plantilla versionada para otros devs.
- `.gitignore` — ignora `.env.*` conservando los `*.example` (`!.env*.example`).
- En CI la variable se define en el entorno del workflow (tiene prioridad; `dotenv`
  no sobrescribe variables ya existentes).

Validado: `pnpm test:all` pasa sin exportar variables a mano (BE 87/5, FE 17/17, E2E 7).

### Ítem 3 — Separar unit/integration ✅
- `backend/package.json`: `test:unit` (`vitest run --exclude '**/postgres/**'`), `test:integration`
  (`vitest run src/features/documents/adapters/outbound/postgres`).
- `package.json` raíz: `test:unit`, `test:unit:backend`, `test:integration`.
- Validado: `test:unit` 74 passed en ~2.1s; `test:integration` 13 passed (DB real).

### Ítem 2 — Wrapper ESM ✅ (entry CJS/ESM; `require.cache` se conserva en los tests)
- `backend/server.js` → `backend/server.cjs` (CJS explícito, idéntico).
- `backend/server.mjs`: `import app from './server.cjs'; export default app;`.
- `backend/package.json`: `main: server.cjs`, `start: node server.cjs`.
- `routes/__tests__/chat.test.js` y `documents.test.js`: `require("../../server")` →
  `require("../../server.cjs")`.
- **No se convirtió `require.cache` a `vi.mock`**: el doc lo marcaba como parcial/opcional y
  reticente; `require.cache` funciona y mantiene la suite en verde (consistente con Fase 6,
  `helpers/auth.js`). El wrapper ESM deja habilitado `vi.mock` para cuando se migren los tests.
- Validado: backend completo pasa (87 passed / 5 skipped); `node server.cjs` carga.

### Ítem 1 — Karma → ui5-test-runner ✅ Migrado y validado (17/17)
**Hallazgos clave:**
- El paquete correcto es `ui5-test-runner` (**sin scope** `@ui5/`; `@ui5/test-runner` no existe en
  npm). Es el sucesor comunitario enlazado por SAP en la nota de deprecación de `karma-ui5`.
  Requiere un navegador: se añadió `playwright` (+ Chromium) como devDep.
- El runner **no usa** `--url <testsuite> --coverage` (one-liner del doc original). Su CLI real:
  `--webapp`, `--ui5 <framework-url>`, `--url <page>`, `--browser $/playwright.js`, `--port`, `--ci`.
- El server del runner se bindea a la IP de LAN; se fuerza `--localhost 127.0.0.1`.

**Por qué NO se usó UI5 Test Starter (`testsuite.qunit.html`/`.js`):** el runner descubre las
páginas del testsuite pero luego abre **directamente** la página de framework
`/resources/sap/ui/test/starter/Test.qunit.html?testsuite=test-resources/chatbot/ui/testsuite.qunit`.
Esa página **no aplica** el `data-sap-ui-resource-roots` (`test-resources.chatbot.ui → ./`) que sí
resuelve `createSuite.js` en el navegador, así que pide
`/test-resources/chatbot/ui/testsuite.qunit.js` → **404** (confirmado: incluso `ui5 serve` da 404
en esa ruta para un proyecto tipo *application*, que se sirve plano en `/`). Falla igual en modo
`--webapp` (legacy) y en el modo recomendado `ui5 serve` + `--url .../testsuite.qunit.html`.

**Solución validada — página QUnit autocontenida:** `webapp/test/unitTests.qunit.html` (reutiliza el
nombre de la antigua testpage de Karma) carga **QUnit por `<script>` síncrono ANTES** del bootstrap
de UI5 (`/resources/sap/ui/thirdparty/qunit-2.js`), de modo que `window.QUnit` existe cuando el
runner *sondea* la página (por eso antes daba "No test page found"). Fija
`data-sap-ui-resource-roots='{"chatbot.ui": "/"}'`, y en `attachInit` hace `sap.ui.require([...5
módulos unit...])` seguido de `QUnit.start()`. Resultado: **17/17** con `EXIT=0`.

**Comando (script `test` de `frontend/package.json`):**
```bash
ui5-test-runner --webapp webapp --ui5 https://ui5.sap.com \
  --port 8888 --localhost 127.0.0.1 \
  --url http://127.0.0.1:8888/test/unitTests.qunit.html \
  --browser $/playwright.js --ci
```

**Cambios aplicados:**
- `frontend/package.json`: `test` → comando de arriba; **eliminadas** devDeps `karma`,
  `karma-chrome-launcher`, `karma-ui5` y `qunit` (QUnit ahora viene del CDN); añadidas
  `ui5-test-runner`, `playwright`.
- `webapp/test/unitTests.qunit.html`: reescrita (carga síncrona de QUnit, root `chatbot.ui → /`).
- **Borrados:** `frontend/karma.conf.js`, archivos temporales `unitTests.ui5tr.qunit.html` y
  `testsuite.qunit.html` (Test Starter no aplica aquí).
- `.gitignore`: ignora `frontend/report/` y `frontend/coverage/`.
- `.github/workflows/test.yml` (`test-frontend`): reemplazado `browser-actions/setup-chrome@v1`
  por `pnpm -C frontend exec playwright install --with-deps chromium`.

**Notas / deuda (ponytail):**
- `webapp/test/testsuite.qunit.js` se mantiene (pre-existente); ya no lo consume nadie con este
  runner, pero es inofensivo y sirve como registro para `ui5 serve` en navegador.
- La suite de **integración OPA5** (`App.journey`) no se ejecuta con esta testpage (igual que en
  Karma, que solo corría los unit). Añadir si se decide correr OPA5 en el runner.
- Sin cobertura Istanbul por ahora (YAGNI). Añadir `--coverage --coverage-reporters lcov` al
  comando cuando se quiera medir cobertura frontend.
- `PLAYWRIGHT_BROWSERS_PATH` no es necesario: Playwright usa por defecto
  `%USERPROFILE%\AppData\Local\ms-playwright` (local) y la ruta por defecto en CI.

## Riesgos

- **ui5-test-runner**: puede no ser compatible con todas las features de SAPUI5 que usa el proyecto. Verificar con `pnpm test` después de la migración.
- **ESM wrapper**: puede introducir problemas si otras partes del proyecto dependen de `require("./server")`. Evaluar antes de implementar.
- **Separación unit/integration**: los tests de rutas (HTTP mockeado) son unitarios, pero los de DB (PostgresRepository) son integración. La separación por nombre de archivo es frágil si se agregan nuevos tests. Mejor usar etiquetas Vitest: `test.concurrent` o `test.tags`.

## Checklist

- [x] Instalar `ui5-test-runner` en frontend y verificar que `pnpm test` pasa (17/17, `EXIT=0`)
- [x] Eliminar dependencias karma de `frontend/package.json`
- [x] Agregar `test:unit` y `test:integration` en `backend/package.json`
- [x] Agregar `test:unit` y `test:integration` en `root/package.json`
- [x] Eliminar credenciales hardcodeadas de `vitest.setup.js`
- [x] Verificar: `pnpm test:unit` corre solo tests rápidos
- [x] Verificar: `pnpm test:integration` corre solo tests de DB/HTTP real
- [x] Verificar: `pnpm test` sigue corriendo todo

## Criterios de aceptación

- `pnpm test` en raíz corre backend + frontend y pasa
- `pnpm test:unit` corre en <5s (solo tests rápidos)
- `pnpm test:integration` corre tests de DB real
- Credenciales hardcodeadas eliminadas; falla con error claro si no hay env var
- ui5-test-runner genera reporte de cobertura frontend (opcional)
