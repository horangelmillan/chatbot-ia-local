sap.ui.define([
  "sap/ui/core/BusyIndicator"
], function (BusyIndicator) {
  "use strict";
  return {
    showBusy: function () {
      BusyIndicator.show(0);
    },
    hideBusy: function () {
      BusyIndicator.hide();
    }
  };
});
