const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./specs",
  timeout: 30000,
  expect: { timeout: 10000 },
  use: {
    baseURL: "http://localhost:8080",
    headless: true,
  },
});
