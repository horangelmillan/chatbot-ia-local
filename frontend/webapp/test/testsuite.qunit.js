sap.ui.define(function () {
  "use strict";
  return {
    name: "chatbot.ui.testsuite",
    defaults: {
      qunit: { version: 2 },
      ui5: { libs: "sap.m" }
    },
    tests: {
      "Util.helper": { title: "Util Helper", module: "test/unit/helper/Util.helper" },
      "WelcomeOptions": { title: "Welcome Options", module: "test/unit/config/WelcomeOptions" },
      "models": { title: "Models", module: "test/unit/model/models" },
      "App.controller": { title: "App Controller Unit", module: "test/unit/controller/App.controller" },
      "App.integration": { title: "App Integration", module: "test/integration/App.journey" }
    }
  };
});
