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
      env: {
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://chatbot_user:chatbot_pass_2026@localhost:5432/chatbot_rag_e2e",
        INDEX_KB_ON_START: "false",
      },
    },
    {
      command: "npx ui5 serve",
      port: 8080,
      cwd: "../frontend",
      reuseExistingServer: true,
    },
  ],
});
