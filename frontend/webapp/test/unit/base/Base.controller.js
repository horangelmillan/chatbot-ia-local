sap.ui.define([
  "chatbot/ui/base/Base.controller"
], function (BaseController) {
  "use strict";

  QUnit.module("Base.controller", {
    beforeEach: function () {
      this.oController = new BaseController();
    },
    afterEach: function () {
      this.oController.destroy();
    }
  });

  QUnit.test("showMessage con tipo normal usa MessageToast sin opciones", function (assert) {
    var done = assert.async();
    var fnOrig = sap.m.MessageToast.show;
    sap.m.MessageToast.show = function (sText, oOptions) {
      assert.strictEqual(sText, "Mensaje normal");
      assert.strictEqual(oOptions, undefined, "sin opciones extra");
      done();
    };
    this.oController.showMessage("Mensaje normal");
    sap.m.MessageToast.show = fnOrig;
  });

  QUnit.test("showMessage con tipo error usa MessageToast con duracion 4000", function (assert) {
    var done = assert.async();
    var fnOrig = sap.m.MessageToast.show;
    sap.m.MessageToast.show = function (sText, oOptions) {
      assert.strictEqual(sText, "Error message");
      assert.strictEqual(oOptions.duration, 4000, "duracion 4000ms");
      done();
    };
    this.oController.showMessage("Error message", "error");
    sap.m.MessageToast.show = fnOrig;
  });
});
