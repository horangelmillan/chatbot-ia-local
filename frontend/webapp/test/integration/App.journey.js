sap.ui.define([
  "sap/ui/test/Opa5",
  "chatbot/ui/test/integration/pages/App"
], function (Opa5) {
  "use strict";
  QUnit.module("App");

  Opa5.extendConfig({
    arrangements: new Opa5({ iStartMyApp: function () { return this.iStartMyUIComponent({ componentConfig: { name: "chatbot.ui" }, hash: "" }); } }),
    viewNamespace: "chatbot.ui.view.",
    actions: new Opa5(),
    assertions: new Opa5()
  });

  QUnit.test("Debe mostrar el input y boton de envio", function (assert) {
    return this.waitFor({
      id: "chatInput",
      viewName: "App",
      success: function () {
        assert.ok(true, "chatInput visible");
      },
      errorMessage: "chatInput no encontrado"
    }).then(function () {
      return this.waitFor({
        id: "sendButton",
        viewName: "App",
        success: function () {
          assert.ok(true, "sendButton visible");
        },
        errorMessage: "sendButton no encontrado"
      });
    });
  });

  QUnit.test("Debe mostrar la lista de mensajes", function (assert) {
    return this.waitFor({
      id: "messageList",
      viewName: "App",
      success: function () {
        assert.ok(true, "messageList visible");
      },
      errorMessage: "messageList no encontrado"
    });
  });
});
