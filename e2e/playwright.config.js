const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./specs",
  timeout: 30000,
  expect: { timeout: 10000 },
  use: {
    baseURL: "http://localhost:8080",
    headless: true,
  },
  webServer: [
    {
      command: "node server.js",
      port: 3001,
      cwd: "../backend",
      reuseExistingServer: true,
      env: { NODE_ENV: "production" },
    },
    {
      command: "npx ui5 serve",
      port: 8080,
      cwd: "../frontend",
      reuseExistingServer: true,
    },
  ],
});
