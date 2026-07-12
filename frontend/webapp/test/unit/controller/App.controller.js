sap.ui.define(["chatbot/ui/controller/App.controller", "sap/ui/model/json/JSONModel"], function (AppController, JSONModel) {
  "use strict";
  function fakeList() {
    return { getDomRef: function () { return {}; }, scrollToIndex: function () {}, getItems: function () { return []; } };
  }
  QUnit.module("App.controller", {
    beforeEach: function () {
      this.oController = new AppController();
      this.oController.getView = function () {
        return {
          setModel: function () {},
          getModel: function () {},
          byId: function (sId) {
            if (sId === "messageList") return fakeList();
            return { focus: function () {} };
          },
          getId: function () { return "fakeView"; }
        };
      };
    },
    afterEach: function () {
      this.oController.destroy();
    }
  });

  QUnit.test("onInit crea modelos y muestra welcome", function (assert) {
    var fnOrig = this.oController._loadConfig;
    this.oController._loadConfig = function () {};
    this.oController.onInit();
    assert.ok(this.oController._messagesModel, "messages model creado");
    assert.ok(this.oController._inputModel, "input model creado");
    var aItems = this.oController._messagesModel.getProperty("/items");
    assert.strictEqual(aItems.length, 1, "welcome agregado");
    assert.strictEqual(aItems[0].sender, "Asistente");
    this.oController._loadConfig = fnOrig;
  });

  QUnit.test("onLiveChange actualiza text y valid", function (assert) {
    this.oController._inputModel = new JSONModel({ text: "", valid: false });
    this.oController.onLiveChange({ getParameter: function () { return "hola"; } });
    assert.strictEqual(this.oController._inputModel.getProperty("/text"), "hola");
    assert.strictEqual(this.oController._inputModel.getProperty("/valid"), true);
    this.oController.onLiveChange({ getParameter: function () { return "  "; } });
    assert.strictEqual(this.oController._inputModel.getProperty("/valid"), false);
  });

  QUnit.test("_addMessage agrega item al modelo", function (assert) {
    this.oController._messagesModel = new JSONModel({ items: [] });
    this.oController._addMessage("Usuario", "test msg");
    var aItems = this.oController._messagesModel.getProperty("/items");
    assert.strictEqual(aItems.length, 1);
    assert.strictEqual(aItems[0].sender, "Usuario");
    assert.strictEqual(aItems[0].text, "test msg");
  });

  QUnit.test("_showWelcome agrega welcome con botones", function (assert) {
    this.oController._messagesModel = new JSONModel({ items: [] });
    this.oController._showWelcome();
    var aItems = this.oController._messagesModel.getProperty("/items");
    assert.strictEqual(aItems.length, 1);
    assert.strictEqual(aItems[0].sender, "Asistente");
    assert.ok(Array.isArray(aItems[0].buttons));
    assert.ok(aItems[0].buttons.length > 0);
  });

  QUnit.test("onNewSession resetea modelos", function (assert) {
    this.oController._messagesModel = new JSONModel({ items: [{ sender: "Usuario", text: "x" }] });
    this.oController._inputModel = new JSONModel({ text: "algo", valid: true });
    var bWelcomeCalled = false;
    this.oController._showWelcome = function () { bWelcomeCalled = true; };
    this.oController.onNewSession();
    assert.strictEqual(this.oController._messagesModel.getProperty("/items").length, 0, "mensajes limpiados");
    assert.strictEqual(this.oController._inputModel.getProperty("/text"), "", "input limpio");
    assert.strictEqual(this.oController._inputModel.getProperty("/valid"), false, "input invalido");
    assert.ok(bWelcomeCalled, "mostro welcome");
  });

  QUnit.test("_buildHistory respeta _maxHistory", function (assert) {
    this.oController._messagesModel = new JSONModel({ items: [] });
    var aItems = this.oController._messagesModel.getProperty("/items");
    for (var i = 0; i < 10; i++) {
      aItems.push({ sender: i % 2 === 0 ? "Usuario" : "Asistente", text: "msg" + i });
    }
    this.oController._maxHistory = 4;
    var h = this.oController._buildHistory();
    assert.strictEqual(h.length, 4, "max 4 historicos");
    assert.strictEqual(h[0].content, "msg6");
  });

  QUnit.test("itemFactory devuelve CustomListItem con texto", function (assert) {
    this.oController._messagesModel = new JSONModel({ items: [{ sender: "Asistente", text: "respuesta" }] });
    var oCtx = this.oController._messagesModel.getContext("/items/0");
    var oItem = this.oController.itemFactory("id", oCtx);
    assert.ok(oItem);
    assert.strictEqual(oItem.getMetadata().getName(), "sap.m.CustomListItem");
  });

  QUnit.test("onSend procesa mensaje valido", function (assert) {
    var done = assert.async();
    this.oController._messagesModel = new JSONModel({ items: [] });
    this.oController._inputModel = new JSONModel({ text: "mensaje valido", valid: true });
    var sCaptured = "";
    this.oController._callBackend = function (sMsg) { sCaptured = sMsg; };
    this.oController.onSend();
    assert.strictEqual(this.oController._messagesModel.getProperty("/items").length, 1, "mensaje usuario agregado");
    assert.strictEqual(this.oController._messagesModel.getProperty("/items/0/sender"), "Usuario");
    assert.strictEqual(sCaptured, "mensaje valido");
    done();
  });

  QUnit.test("onSend no hace nada con texto vacio", function (assert) {
    this.oController._messagesModel = new JSONModel({ items: [] });
    this.oController._inputModel = new JSONModel({ text: "", valid: false });
    var bCalled = false;
    this.oController._callBackend = function () { bCalled = true; };
    this.oController.onSend();
    assert.strictEqual(this.oController._messagesModel.getProperty("/items").length, 0);
    assert.strictEqual(bCalled, false);
  });
});
