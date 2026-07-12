# Fase 2: E2E — Flujos completos con Playwright

> Prioridad: 🔴 Crítico | Esfuerzo: 3-4h | Dependencias: Fase 4 recomendada (opcional)

## Contexto

Actualmente hay **2 tests E2E** que solo verifican que la página carga y el botón de enviar se habilita. No hay ningún test que simule un flujo real de usuario: escribir un mensaje, enviarlo, esperar respuesta, verificar que la respuesta aparece en el DOM.

Si el backend deja de responder o el frontend no renderiza respuestas correctamente, los tests actuales no lo detectarían.

## Diagnóstico

```bash
cd e2e && pnpm playwright test --list
# 2 tests: page load + button enable
```

Problemas identificados:
- **Sin seed de datos**: los tests usan la DB compartida `chatbot_rag_test` sin datos controlados
- **Sin helpers**: no hay `setup.js`/`teardown.js` para preparar el estado inicial
- **Selectores frágiles**: `[id$='--chatInput']` depende del naming auto-generado de SAPUI5
- **Sin validación de respuesta**: ningún test verifica que el servidor respondió correctamente

## Solución

### 1. Helpers de setup/teardown

Crear `e2e/helpers/setup.js`:

```js
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TEST || "postgresql://chatbot_user:chatbot_pass_2026@localhost:5432/chatbot_rag_test" });

async function seedTestData() {
  await pool.query("TRUNCATE faq, document_chunks, documents CASCADE");
  await pool.query(`
    INSERT INTO faq (code, question, answer, category, keywords)
    VALUES ('E2E-FAQ-001', '¿Como facturar?', 'Debes seguir estos pasos...', 'Facturacion', ARRAY['factura', 'pasos'])
  `);
}

async function teardown() {
  await pool.end();
}

module.exports = { seedTestData, teardown };
```

### 2. Selectores robustos

En las vistas SAPUI5, agregar `data-testid` a los controles críticos (opcional si no se puede modificar la vista XML, usar `id` fijo):

```xml
<Input id="chatInput" ... />
<Button id="sendButton" ... />
<List id="messageList" ... />
```

Los selectores en tests usarán `page.locator("#chatInput")` o `page.getByRole("textbox")`.

### 3. Tests de flujo completo

Agregar a `e2e/specs/app.spec.js`:

```js
const { test, expect } = require("@playwright/test");
const { seedTestData, teardown } = require("../helpers/setup");

test.describe("Flujo completo de chat", () => {
  test.beforeAll(async () => {
    await seedTestData();
  });

  test.afterAll(async () => {
    await teardown();
  });

  test("usuario envia mensaje y recibe respuesta", async ({ page }) => {
    await page.goto("/index.html", { timeout: 20000 });
    const input = page.locator("#chatInput").locator("input");
    const sendBtn = page.locator("#sendButton");

    await input.fill("hola");
    await sendBtn.click();

    // Esperar a que aparezca la respuesta del asistente
    await expect(page.locator(".chat-message-response")).toBeVisible({ timeout: 15000 });
  });

  test("usuario pregunta por facturación y recibe FAQ", async ({ page }) => {
    await page.goto("/index.html", { timeout: 20000 });
    const input = page.locator("#chatInput").locator("input");
    const sendBtn = page.locator("#sendButton");

    await input.fill("¿como facturo?");
    await sendBtn.click();

    await expect(page.locator(".faq-answer")).toBeVisible({ timeout: 15000 });
  });

  test("nueva sesion limpia el historial", async ({ page }) => {
    await page.goto("/index.html", { timeout: 20000 });
    // Primero enviar un mensaje
    await page.locator("#chatInput").locator("input").fill("hola");
    await page.locator("#sendButton").click();
    await expect(page.locator(".chat-message-response")).toBeVisible({ timeout: 15000 });

    // Hacer clic en nueva sesión
    await page.locator("#newSessionButton").click();
    const messages = page.locator(".chat-message");
    await expect(messages).toHaveCount(0);
  });
});
```

### 4. Fixtures de datos de prueba

Crear `e2e/fixtures/` con archivos SQL/JSON para seed controlado:

```
e2e/fixtures/
├── faq.sql        # INSERT INTO faq ...
└── documents/     # Archivos .md para indexar
    └── test.md
```

## Archivos a modificar/crear

| Archivo | Acción |
|---------|--------|
| `e2e/helpers/setup.js` | Crear — seed y teardown de DB |
| `e2e/specs/app.spec.js` | Modificar — agregar 3 tests nuevos + fixtures |
| `e2e/fixtures/faq.sql` | Crear — datos de prueba |
| `e2e/fixtures/documents/test.md` | Crear — documento de prueba |

## Checklist

- [ ] Crear `e2e/helpers/setup.js` con seed + teardown
- [ ] Test: enviar mensaje y esperar respuesta del asistente
- [ ] Test: preguntar por facturación y ver FAQ renderizado
- [ ] Test: nueva sesión limpia mensajes
- [ ] Verificar selectores robustos (data-testid o ids fijos)
- [ ] Verificar: `cd e2e && pnpm playwright test` pasa

## Criterios de aceptación

- `cd e2e && pnpm playwright test` muestra ≥5 tests, todos passing
- Los tests usan seed de datos controlados, no dependen de datos existentes en DB
- Cada test verifica un estado visible en el DOM (no solo HTTP status)
- La limpieza después de tests deja la DB en estado conocido
