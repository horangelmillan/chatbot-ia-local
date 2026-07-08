sap.ui.define(
    ["sap/ui/core/mvc/Controller", "sap/ui/core/routing/History", "sap/ui/core/UIComponent"],
    function (Controller, History, UIComponent) {
        "use strict";

        return Controller.extend("com.mundocloud.assetmanagement.component.portal.base.Base", {
            _getRouter: function () {
                return UIComponent.getRouterFor(this);
            },

            onNavBack: function () {
                const oHistory = History.getInstance();
                const sPreviousHash = oHistory.getPreviousHash();
                const oModelPortal = this.getView().getModel("ModelPortal");

                if (sPreviousHash !== undefined) {
                    oModelPortal.setProperty("/showButtonNavBack", sPreviousHash !== "");

                    if (sPreviousHash === "") {
                        oModelPortal.setProperty("/showFooter", true);
                    }

                    window.history.go(-1);
                } else {
                    oModelPortal.setProperty("/showFooter", true);
                    oModelPortal.setProperty("/showButtonNavBack", false);
                    this._getRouter().navTo("RouteMain", {}, {}, true);
                }
            },

            onNavTo: function (sRoute) {
                const oHistory = History.getInstance();
                const sPreviousHash = oHistory.getPreviousHash();
                const oModelPortal = this.getView().getModel("ModelPortal");

                if (oHistory.aHistory.length === 1 && sPreviousHash !== undefined) {
                    oModelPortal.setProperty("/showButtonNavBack", sPreviousHash !== "");

                    if (sPreviousHash === "") {
                        oModelPortal.setProperty("/showFooter", true);
                    }

                    window.history.go(-1);
                } else {
                    oModelPortal.setProperty("/showFooter", false);
                    oModelPortal.setProperty("/showButtonNavBack", true);
                    this._getRouter().navTo(sRoute, {}, {}, false);
                }
            },
        });
    },
);
