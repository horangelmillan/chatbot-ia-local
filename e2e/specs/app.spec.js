const { test, expect } = require("@playwright/test");
const { seedTestData, teardown } = require("../helpers/setup");

const useRealLm = process.env.E2E_USE_REAL_LM === "true";

test.describe("Flujo completo de chat", () => {
  test.beforeAll(async () => {
    await seedTestData();
  });

  test.afterAll(async () => {
    await teardown();
  });

  test("la pagina carga y muestra el input de chat", async ({ page }) => {
    await page.goto("/index.html", { timeout: 20000 });
    await expect(page.locator("[id$='--chatInput']")).toBeVisible({ timeout: 20000 });
    await expect(page.locator("[id$='--sendButton']")).toBeVisible();
  });

  test("el boton de enviar se habilita al escribir", async ({ page }) => {
    await page.goto("/index.html", { timeout: 20000 });
    const input = page.locator("[id$='--chatInput'] input");
    const sendBtn = page.locator("[id$='--sendButton']");
    await expect(sendBtn).toBeDisabled();
    await input.fill("hola");
    await expect(sendBtn).toBeEnabled();
  });

  test("usuario envia mensaje y recibe respuesta del asistente", async ({ page }) => {
    await page.goto("/index.html", { timeout: 20000 });
    const input = page.locator("[id$='--chatInput'] input");
    const sendBtn = page.locator("[id$='--sendButton']");

    await input.fill("hola");
    await sendBtn.click();

    await expect(page.locator(".userBubble")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".assistantBubble").first()).toBeVisible({ timeout: 15000 });
  });

  test("usuario pregunta por facturacion y recibe FAQ renderizado", async ({ page }) => {
    if (!useRealLm) {
      await page.route(/\/api\/chat$/, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            reply: "¿Como facturar?\n\nDebes seguir estos pasos: 1. Inicia sesion 2. Ve a facturacion 3. Descarga tu factura",
            type: "document",
          }),
        });
      });
    }

    await page.goto("/index.html", { timeout: 20000 });
    await page.locator("[id$='--chatInput'] input").fill("¿como facturo?");
    await page.locator("[id$='--sendButton']").click();

    await expect(page.locator(".docBubble")).toBeVisible({ timeout: 20000 });
    await expect(page.locator(".docBubble")).toContainText(/factur/i);
  });

  test("nueva sesion limpia los mensajes del usuario", async ({ page }) => {
    await page.goto("/index.html", { timeout: 20000 });
    const input = page.locator("[id$='--chatInput'] input");
    const sendBtn = page.locator("[id$='--sendButton']");

    await input.fill("hola");
    await sendBtn.click();
    await expect(page.locator(".assistantBubble").first()).toBeVisible({ timeout: 15000 });

    const newSessionBtn = page.getByRole("button", { name: "Nueva sesion" });
    await newSessionBtn.click();

    await expect(page.locator(".userBubble")).toHaveCount(0);
    await expect(page.locator(".assistantBubble")).toHaveCount(1);
  });

  test("la busqueda de documentos encuentra datos seed via API", async ({ request }) => {
    const res = await request.get("http://localhost:3001/api/documents/search?q=electronica");
    const data = await res.json();
    expect(data.found).toBe(true);
    expect(data.type).toBe("faq");
    expect(data.data.category).toBe("General");
    expect(data.data.answer).toContain("Factura Electronica");
  });

  test("usuario pregunta sobre facturacion electronica y recibe documentacion", async ({ page }) => {
    if (!useRealLm) {
      await page.route(/\/api\/chat$/, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            reply: "Para facturar electronicamente debes ingresar al modulo de facturacion, seleccionar Factura Electronica y completar los datos del cliente.",
            type: "document",
          }),
        });
      });
    }

    await page.goto("/index.html", { timeout: 20000 });
    await page.locator("[id$='--chatInput'] input").fill("¿como facturo electronico?");
    await page.locator("[id$='--sendButton']").click();

    await expect(page.locator(".docBubble")).toBeVisible({ timeout: 20000 });
    await expect(page.locator(".docBubble")).toContainText(/factur/i);
  });
});
