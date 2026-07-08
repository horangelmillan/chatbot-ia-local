sap.ui.define([
  "chatbot/ui/base/Base.controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/CustomListItem",
  "sap/m/VBox",
  "sap/m/Text",
  "chatbot/ui/helper/Util.helper"
], function (BaseController, JSONModel, CustomListItem, VBox, Text, Util) {
  "use strict";
  return BaseController.extend("chatbot.ui.controller.Chat", {
    onInit: function () {
      this._messagesModel = new JSONModel({ items: [] });
      this.getView().setModel(this._messagesModel, "messages");
      this._inputModel = new JSONModel({ text: "", valid: false });
      this.getView().setModel(this._inputModel, "chatInput");
    },
    onLiveChange: function (oEvent) {
      var sValue = oEvent.getParameter("value") || "";
      this._inputModel.setProperty("/text", sValue);
      this._inputModel.setProperty("/valid", sValue.trim().length > 0);
    },
    onSend: function () {
      var sText = this._inputModel.getProperty("/text");
      if (!sText || sText.trim() === "") return;
      this._addMessage("Usuario", sText);
      this._inputModel.setProperty("/text", "");
      this._inputModel.setProperty("/valid", false);
      Util.showBusy();
      this._callBackend(sText);
    },
    _addMessage: function (sSender, sText) {
      var aItems = this._messagesModel.getProperty("/items");
      aItems.push({ sender: sSender, text: sText });
      this._messagesModel.refresh(true);
      this._scrollToBottom();
    },
    _scrollToBottom: function () {
      var oList = this.getView().byId("messageList");
      if (oList) setTimeout(function () { oList.scrollToIndex(-1); }, 50);
    },
    _callBackend: function (sMessage) {
      var that = this;
      fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: sMessage })
      })
        .then(function (oRes) {
          if (!oRes.ok) throw new Error("Error " + oRes.status);
          return oRes.json();
        })
        .then(function (oData) { that._addMessage("Asistente", oData.reply); })
        .catch(function (oErr) { that._addMessage("Asistente", oErr.message); })
        .finally(function () { Util.hideBusy(); });
    },
    itemFactory: function (sId, oContext) {
      var oData = oContext && oContext.getObject();
      if (!oData) return new CustomListItem();
      var bUser = oData.sender === "Usuario";
      var oVBox = new VBox({ items: [new Text({ text: oData.text })] });
      oVBox.addStyleClass(bUser ? "userBubble" : "assistantBubble");
      return new CustomListItem({ content: [oVBox] });
    }
  });
});
