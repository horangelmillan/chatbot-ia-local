const { test, expect } = require("@playwright/test");

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
