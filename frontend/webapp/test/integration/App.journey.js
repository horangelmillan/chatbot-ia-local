sap.ui.define([
  "sap/ui/test/Opa5",
  "chatbot/ui/test/integration/pages/App"
], function (Opa5) {
  "use strict";
  QUnit.module("App Integration");

  function mockFetch() {
    window.fetch = function (url) {
      if (url.toString().includes("/api/config")) {
        return Promise.resolve(new Response(JSON.stringify({ chatHistoryLimit: 10 }), { status: 200, headers: { "Content-Type": "application/json" } }));
      }
      if (url.toString().includes("/api/chat/reset")) {
        return Promise.resolve(new Response(null, { status: 200 }));
      }
      if (url.toString().includes("/api/chat")) {
        return Promise.resolve(new Response(JSON.stringify({ reply: "Respuesta mock", type: "reply" }), { status: 200, headers: { "Content-Type": "application/json" } }));
      }
      return Promise.reject(new Error("URL no mockeada: " + url));
    };
  }

  Opa5.extendConfig({
    arrangements: new Opa5({
      iStartMyApp: function () {
        mockFetch();
        return this.iStartMyUIComponent({ componentConfig: { name: "chatbot.ui" }, hash: "" });
      }
    }),
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
