sap.ui.define(
    [
        "com/mundocloud/assetmanagement/component/assetInventory/base/Base.controller",
        "com/mundocloud/assetmanagement/component/assetInventory/helper/Util.helper",
    ],
    function (BaseController, Util) {
        "use strict";

        return BaseController.extend(
            "com.mundocloud.assetmanagement.component.assetInventory.controller.assetInventory.FormCreate",
            {
                onInit() {
                    this.oModel = this.getOwnerComponent().getModel("ModelForm");
                    this.getView().setModel(this.oModel);

                    this.fnInitController();

                    this._getRouter()
                        .getRoute("RouteFormCreate")
                        .attachMatched(this._onRouteMatched, this);
                },

                _onRouteMatched: async function () {
                    try {
                        Util.loader(true);
                        await this.fnClearFields();
                    } catch (error) {
                        console.log(error);
                    } finally {
                        Util.loader(false);
                    }
                },

                onLiveChangeAmount: function (oEvent) {
                    const sValue = oEvent.getSource().getValue();
                    const aValue = sValue.match(/(\d+)/);

                    oEvent.getSource().setValue(aValue[0]);
                    this.onValidateField(oEvent);
                },

                fnClearFields: async function () {
                    this.oModel.setProperty("/mFormCreate", {
                        excludes: {},
                        activo: {},
                    });
                },

                onMaxDate: function (oEvent) {
                    const oCurrentDate = new Date();
                    this.oModel.setProperty("/mConfigView/max_date", oCurrentDate);
                },
            },
        );
    },
);
