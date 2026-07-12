sap.ui.define(["sap/ui/test/Opa5"], function (Opa5) {
  "use strict";
  return Opa5.extend("chatbot.ui.test.pages.App", {
    iStartTheApp: function () {
      return this.iStartMyUIComponent({
        componentConfig: { name: "chatbot.ui", async: true },
        hash: ""
      });
    },

    iShouldSeeTheChatInput: function () {
      return this.waitFor({
        id: "chatInput",
        viewName: "App",
        success: function () {
          Opa5.assert.ok(true, "El input de chat esta visible");
        },
        errorMessage: "No se encontro el input de chat"
      });
    },

    iShouldSeeTheSendButton: function () {
      return this.waitFor({
        id: "sendButton",
        viewName: "App",
        success: function () {
          Opa5.assert.ok(true, "El boton de enviar esta visible");
        },
        errorMessage: "No se encontro el boton de enviar"
      });
    },

    iShouldSeeTheMessageList: function () {
      return this.waitFor({
        id: "messageList",
        viewName: "App",
        success: function () {
          Opa5.assert.ok(true, "La lista de mensajes esta visible");
        },
        errorMessage: "No se encontro la lista de mensajes"
      });
    }
  });
});
