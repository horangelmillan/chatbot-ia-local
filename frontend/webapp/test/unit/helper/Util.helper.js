sap.ui.define([
  "sap/ui/core/BusyIndicator",
  "chatbot/ui/helper/Util.helper"
], function (BusyIndicator, Util) {
  "use strict";

  QUnit.module("Util.helper");

  QUnit.test("showBusy llama a BusyIndicator.show", function (assert) {
    var fnOrig = BusyIndicator.show;
    var bCalled = false;
    BusyIndicator.show = function () { bCalled = true; };
    Util.showBusy();
    assert.ok(bCalled, "BusyIndicator.show fue llamado");
    BusyIndicator.show = fnOrig;
  });

  QUnit.test("hideBusy llama a BusyIndicator.hide", function (assert) {
    var fnOrig = BusyIndicator.hide;
    var bCalled = false;
    BusyIndicator.hide = function () { bCalled = true; };
    Util.hideBusy();
    assert.ok(bCalled, "BusyIndicator.hide fue llamado");
    BusyIndicator.hide = fnOrig;
  });
});
