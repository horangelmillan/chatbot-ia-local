sap.ui.define(["chatbot/ui/config/WelcomeOptions"], function (Options) {
  "use strict";
  QUnit.module("WelcomeOptions");

  QUnit.test("devuelve un array", function (assert) {
    assert.ok(Array.isArray(Options));
  });

  QUnit.test("cada opcion tiene label y message", function (assert) {
    Options.forEach(function (o, i) {
      assert.ok(typeof o.label === "string", "opcion " + i + " tiene label");
      assert.ok(typeof o.message === "string", "opcion " + i + " tiene message");
    });
  });
});
