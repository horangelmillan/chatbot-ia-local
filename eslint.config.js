const globals = require("globals");

module.exports = [
  {
    ignores: [
      "**/node_modules/**",
      "**/coverage/**",
      "**/dist/**",
      "**/build/**",
      "**/.agents/**",
      "**/.codebase-memory/**",
      "**/docs/**",
    ],
  },

  // Backend (CommonJS, Node) y scripts E2E
  {
    files: ["backend/**/*.js", "e2e/**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      ecmaVersion: 2022,
      globals: { ...globals.node },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-console": "off",
    },
  },

  // Backend tests (globals de Vitest)
  {
    files: ["backend/**/__tests__/**/*.js", "backend/**/*.test.js"],
    languageOptions: {
      globals: {
        ...globals.node,
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        vi: "readonly",
      },
    },
  },

  // Frontend OpenUI5 (AMD vía sap.ui.define, globals de navegador + QUnit)
  {
    files: ["frontend/webapp/**/*.js"],
    languageOptions: {
      sourceType: "script",
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        sap: "readonly",
        jQuery: "readonly",
        QUnit: "readonly",
        sinon: "readonly",
        module: "readonly",
        test: "readonly",
        asyncTest: "readonly",
        start: "readonly",
        stop: "readonly",
        ok: "readonly",
        equal: "readonly",
        strictEqual: "readonly",
        deepEqual: "readonly",
        expect: "readonly",
        assert: "writable",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-console": "off",
    },
  },
];
