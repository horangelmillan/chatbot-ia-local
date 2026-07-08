sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast"
], function (Controller, MessageToast) {
  "use strict";
  return Controller.extend("chatbot.ui.base.BaseController", {
    showMessage: function (sText, sType) {
      if (sType === "error") {
        MessageToast.show(sText, { duration: 4000 });
      } else {
        MessageToast.show(sText);
      }
    }
  });
});
