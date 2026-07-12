const { test, expect } = require("@playwright/test");

test("la pagina carga y muestra el input de chat", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#__xmlview0--chatInput") .or(page.locator("[id$='--chatInput']"))).toBeVisible({ timeout: 15000 });
  await expect(page.locator("#__xmlview0--sendButton").or(page.locator("[id$='--sendButton']"))).toBeVisible();
});

test("el boton de enviar se habilita al escribir", async ({ page }) => {
  await page.goto("/");
  const input = page.locator("[id$='--chatInput']");
  const sendBtn = page.locator("[id$='--sendButton']");
  await expect(sendBtn).toBeDisabled();
  await input.fill("hola");
  await expect(sendBtn).toBeEnabled();
});
