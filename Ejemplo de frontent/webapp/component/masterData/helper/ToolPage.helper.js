sap.ui.define(
    [
        "sap/ui/Device",
        "sap/ui/base/ManagedObject",
        "sap/ui/model/json/JSONModel",
        "sap/m/Popover",
        "sap/m/Button",
        "sap/m/library",
    ],
    function (Device, ManagedObject, JSONModel, Popover, Button, library) {
        "use strict";

        var ButtonType = library.ButtonType,
            PlacementType = library.PlacementType;

        return ManagedObject.extend(
            "com.mundocloud.assetmanagement.component.masterData.helper.ToolPage.helper",
            {
                constructor: function (oController) {
                    this._oController = oController;
                },

                onItemSelect: function (oEvent) {
                    let oItem = oEvent.getParameter("item");
                    let oDataItem = this._oController.oModel.getProperty(
                        oItem.getBindingContext().getPath(),
                    );
                    let oRouter = this._oController.getOwnerComponent().getRouter();
                    oRouter.navTo(oDataItem.route, {}, {}, true);
                },

                handleUserNamePress: function (event) {
                    var oPopover = new Popover({
                        showHeader: false,
                        placement: PlacementType.Bottom,
                        content: [
                            new Button({
                                text: "Feedback",
                                type: ButtonType.Transparent,
                            }),
                            new Button({
                                text: "Help",
                                type: ButtonType.Transparent,
                            }),
                            new Button({
                                text: "Logout",
                                type: ButtonType.Transparent,
                            }),
                        ],
                    }).addStyleClass("sapMOTAPopover sapTntToolHeaderPopover");

                    oPopover.openBy(event.getSource());
                },

                onSideNavButtonPress: function () {
                    var oToolPage = this._oController.byId("MasterData");
                    var bSideExpanded = oToolPage.getSideExpanded();

                    this._setToggleButtonTooltip(bSideExpanded);

                    oToolPage.setSideExpanded(!oToolPage.getSideExpanded());
                },

                _setToggleButtonTooltip: function (bLarge) {
                    var oToggleButton = this._oController.byId("sideNavigationToggleButton");
                    if (bLarge) {
                        oToggleButton.setTooltip("Large Size Navigation");
                    } else {
                        oToggleButton.setTooltip("Small Size Navigation");
                    }
                },
            },
        );
    },
);
