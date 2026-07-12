sap.ui.define([
	"chatbot/ui/base/Base.controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/CustomListItem",
	"sap/m/VBox",
	"sap/m/Text",
	"sap/m/Button",
	"chatbot/ui/helper/Util.helper",
	"chatbot/ui/config/WelcomeOptions"
], function (BaseController, JSONModel, CustomListItem, VBox, Text, Button, Util, WelcomeOptions) {
	"use strict";
	return BaseController.extend("chatbot.ui.controller.App", {
		onInit: function () {
			this._messagesModel = new JSONModel({ items: [] });
			this.getView().setModel(this._messagesModel, "messages");
			this._inputModel = new JSONModel({ text: "", valid: false });
			this.getView().setModel(this._inputModel, "chatInput");
			this.getView().byId("chatInput").focus();
			this._maxHistory = 6;
			this._loadConfig();
			this._showWelcome();
		},
		_loadConfig: function () {
			var that = this;
			fetch("http://localhost:3001/api/config").then(function (oRes) { return oRes.json(); }).then(function (oData) {
				if (oData.chatHistoryLimit) that._maxHistory = oData.chatHistoryLimit;
			}).catch(function () { });
		},
		onLiveChange: function (oEvent) {
			var sValue = oEvent.getParameter("value") || "";
			this._inputModel.setProperty("/text", sValue);
			this._inputModel.setProperty("/valid", sValue.trim().length > 0);
		},
		onNewSession: function () {
			this._messagesModel.setProperty("/items", []);
			this._inputModel.setProperty("/text", "");
			this._inputModel.setProperty("/valid", false);
			fetch("http://localhost:3001/api/chat/reset", { method: "POST" }).catch(function () { });
			this._showWelcome();
		},
		onSend: function () {
			var sText = this._inputModel.getProperty("/text");
			if (!sText || sText.trim() === "") return;
			// ponytail: disable all unselected buttons from previous messages
			var aItems = this._messagesModel.getProperty("/items");
			for (var i = 0; i < aItems.length; i++) {
				if (aItems[i].buttons && !aItems[i]._buttonsDisabled) {
					this._messagesModel.setProperty("/items/" + i + "/_buttonsDisabled", true);
				}
			}
			this._addMessage("Usuario", sText);
			this._inputModel.setProperty("/text", "");
			this._inputModel.setProperty("/valid", false);
			Util.showBusy();
			this._callBackend(sText);
		},
		_addMessage: function (sSender, sText, aButtons, sType) {
			var aItems = this._messagesModel.getProperty("/items");
			aItems.push({ sender: sSender, text: sText, buttons: aButtons || null, type: sType || null });
			this._messagesModel.refresh(true);
			this._scrollToBottom();
		},
		_showWelcome: function () {
			this._addMessage("Asistente",
				"¡Hola! Soy tu asistente de Northwind. Puedo consultar pedidos, clientes y facturación. Elige una opción o escríbeme directamente.",
				WelcomeOptions);
		},
		_scrollToBottom: function () {
			var oList = this.getView().byId("messageList");
			if (oList && oList.getDomRef()) oList.scrollToIndex(oList.getItems().length - 1);
		},
		_buildHistory: function () {
			var aItems = this._messagesModel.getProperty("/items");
			var aHistory = [];
			for (var i = Math.max(0, aItems.length - this._maxHistory); i < aItems.length; i++) {
				var o = aItems[i];
				if (o.sender === "Usuario") aHistory.push({ role: "user", content: o.text });
				else if (o.sender === "Asistente") aHistory.push({ role: "assistant", content: o.text });
			}
			return aHistory;
		},
		_callBackend: function (sMessage) {
			var that = this;
			fetch("http://localhost:3001/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: sMessage, history: this._buildHistory() })
			})
				.then(function (oRes) {
					if (!oRes.ok) return oRes.json().then(function (oErr) { throw new Error(oErr.reply || "Error " + oRes.status); });
					return oRes.json();
				})
				.then(function (oData) { that._addMessage("Asistente", oData.reply, oData.buttons, oData.type); })
				.catch(function (oErr) { that._addMessage("Asistente", oErr.message); })
				.finally(function () { Util.hideBusy(); });
		},
		_createButtonRow: function (sPath, aButtons, bDisabled, iSelectedIndex) {
			return aButtons.map(function (b, i) {
				var bSelected = bDisabled && i === iSelectedIndex;
				return new Button({
					text: b.label,
					type: bSelected ? "Accept" : (bDisabled ? "Default" : "Emphasized"),
					enabled: !bDisabled,
					press: function () {
						if (this._messagesModel.getProperty(sPath + "/_buttonsDisabled")) return;
						this._messagesModel.setProperty(sPath + "/_buttonsDisabled", true);
						this._messagesModel.setProperty(sPath + "/_selectedButtonIndex", i);
						this._inputModel.setProperty("/text", b.message);
						this._inputModel.setProperty("/valid", true);
						this.onSend();
					}.bind(this)
				});
			}, this);
		},
		itemFactory: function (sId, oContext) {
			var oData = oContext && oContext.getObject();
			if (!oData) return new CustomListItem();
			var bUser = oData.sender === "Usuario";
			var bDoc = oData.type === "document";
			var aContent = [new Text({ text: oData.text })];
			if (!bUser && oData.buttons && oData.buttons.length > 0) {
				var aBtns = this._createButtonRow(oContext.getPath(), oData.buttons, oData._buttonsDisabled, oData._selectedButtonIndex);
				aContent = aContent.concat(aBtns);
			}
			var oVBox = new VBox({ items: aContent });
			oVBox.addStyleClass(bUser ? "userBubble" : bDoc ? "docBubble" : "assistantBubble");
			return new CustomListItem({ content: [oVBox] });
		}
	});
});