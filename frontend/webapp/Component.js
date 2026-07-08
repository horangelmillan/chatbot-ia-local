sap.ui.define([
  "sap/ui/core/UIComponent"
], function (UIComponent) {
  "use strict";
  return UIComponent.extend("chatbot.ui.Component", {
    metadata: {
      interfaces: ["sap.ui.core.IAsyncContentCreation"],
      manifest: "json"
    }
  });
});