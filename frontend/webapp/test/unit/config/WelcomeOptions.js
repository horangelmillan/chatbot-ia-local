sap.ui.define(["chatbot/ui/config/WelcomeOptions"], function (Options) {
  "use strict";

  QUnit.module("WelcomeOptions");

  QUnit.test("devuelve un array con al menos 2 opciones", function (assert) {
    assert.ok(Array.isArray(Options), "es un array");
    assert.ok(Options.length >= 2, "al menos 2 opciones");
  });

  QUnit.test("cada opcion tiene label y message no vacios", function (assert) {
    Options.forEach(function (o, i) {
      assert.ok(typeof o.label === "string" && o.label.length > 0, "opcion " + i + " label no vacio");
      assert.ok(typeof o.message === "string" && o.message.length > 0, "opcion " + i + " message no vacio");
    });
  });

  QUnit.test("las opciones tienen estructura consistente (solo label y message)", function (assert) {
    Options.forEach(function (o) {
      assert.ok(o.hasOwnProperty("label"), "tiene label");
      assert.ok(o.hasOwnProperty("message"), "tiene message");
      assert.strictEqual(Object.keys(o).length, 2, "solo label y message");
    });
  });
});
