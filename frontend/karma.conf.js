module.exports = function (config) {
  config.set({
    plugins: [require.resolve("karma-ui5"), require.resolve("karma-chrome-launcher")],
    frameworks: ["ui5"],
    browsers: ["ChromeHeadless"],
    ui5: {
      configPath: "ui5.yaml",
      testpage: "webapp/test/unitTests.qunit.html",
      mode: "html"
    },
    client: {
      qunit: { showUI: false }
    },
    singleRun: true,
    reporters: ["progress"]
  });
};
