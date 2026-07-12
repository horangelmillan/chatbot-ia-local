---
name: testing-e2e
description: "Patrones de testing end-to-end para el chatbot OpenUI5 + Express. Cubre Playwright (navegador real), setup de datos de prueba, y validación de flujos completos. Usar al crear tests E2E que ejerciten frontend + backend real."
---

# Testing E2E Skill

## Stack

- **Playwright** — navegador real (Chromium)
- Playwright CLI a través del skill `playwright` (cargar antes de usar herramientas de navegador)
- Backend real en `http://localhost:3001`
- Frontend OpenUI5 en `http://localhost:8080`
- Base de datos `chatbot_rag_test` para datos de prueba

## Estructura

```
e2e/
  playwright.config.js     # configuración de Playwright
  fixtures/                # datos de prueba (SQL, JSON)
  specs/
    chat.spec.js           # flujo principal de chat
    documents.spec.js      # búsqueda en documentos/FAQ
  helpers/
    setup.js               # seed de DB antes de tests
    teardown.js            # limpieza
```

## Patrones

### 1. Setup global

```js
// helpers/setup.js
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL_TEST });

async function seedTestData() {
  await pool.query("TRUNCATE faq, document_chunks, documents CASCADE");
  await pool.query(`
    INSERT INTO faq (code, question, answer, category, keywords)
    VALUES ('E2E-FAQ', '¿Cómo facturar?', 'Sigue estos pasos...', 'Facturacion', ARRAY['factura','pasos'])
  `);
  await pool.end();
}
module.exports = { seedTestData };
```

### 2. Test de flujo completo

```js
// specs/chat.spec.js
const { test, expect } = require("@playwright/test");

test("usuario envía mensaje y recibe respuesta", async ({ page }) => {
  await page.goto("http://localhost:8080");
  await page.fill("#chat-input", "hola");
  await page.click("#sendBtn");
  await expect(page.locator(".chat-message-response")).toBeVisible({ timeout: 10000 });
});
```

### 3. Test de FAQ

```js
test("usuario busca en FAQ y ve resultado", async ({ page }) => {
  await page.goto("http://localhost:8080");
  await page.fill("#chat-input", "¿cómo facturo?");
  await page.click("#sendBtn");
  await expect(page.locator(".faq-answer")).toBeVisible({ timeout: 10000 });
});
```

## Ejecución

```shell
# Requiere backend + frontend corriendo
cd backend && pnpm start &
cd frontend && pnpm start &

# Ejecutar E2E
cd e2e && npx playwright test

# Con UI modo debug
cd e2e && npx playwright test --debug
```

## CI

En pipeline CI:
1. `pnpm install` en frontend + backend + e2e
2. `vitest run` en backend (unit + integración)
3. Iniciar backend + frontend (background)
4. `npx playwright install`
5. `npx playwright test` (E2E)
6. Matar procesos background

## Dependencias

```json
{
  "devDependencies": {
    "@playwright/test": "^1.52.0"
  }
}
```
