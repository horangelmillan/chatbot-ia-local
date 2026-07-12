sap.ui.define(["chatbot/ui/helper/Util.helper"], function (Util) {
  "use strict";
  QUnit.module("Util.helper");

  QUnit.test("showBusy y hideBusy existen", function (assert) {
    assert.strictEqual(typeof Util.showBusy, "function");
    assert.strictEqual(typeof Util.hideBusy, "function");
  });
});
