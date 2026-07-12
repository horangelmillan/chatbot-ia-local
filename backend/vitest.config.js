const { defineConfig } = require("vitest/config");

module.exports = defineConfig({
    test: {
        include: ["src/**/__tests__/**/*.test.js", "routes/**/__tests__/**/*.test.js"],
        globals: true,
        setupFiles: ["./vitest.setup.js"],
        fileParallelism: false,
        coverage: {
            provider: "v8",
            include: ["src/**", "routes/**"],
            exclude: ["src/**/__tests__/**", "routes/**/__tests__/**", "db/**"],
            reporter: ["text", "lcov", "html"]
        }
    }
});
