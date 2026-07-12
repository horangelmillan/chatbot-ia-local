sap.ui.define(["chatbot/ui/model/models"], function (Models) {
  "use strict";
  QUnit.module("models");

  QUnit.test("createMessagesModel devuelve JSONModel", function (assert) {
    var oModel = Models.createMessagesModel();
    assert.ok(oModel);
    assert.strictEqual(oModel.getData().items.length, 0);
  });
});
