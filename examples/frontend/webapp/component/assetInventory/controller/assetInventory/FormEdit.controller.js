sap.ui.define(
    [
        "com/mundocloud/assetmanagement/component/assetInventory/base/Base.controller",
        "com/mundocloud/assetmanagement/component/assetInventory/helper/Util.helper",
        "com/mundocloud/assetmanagement/component/assetInventory/helper/RequestMethods.helper",
    ],
    function (BaseController, Util, RequestMethods) {
        "use strict";

        return BaseController.extend(
            "com.mundocloud.assetmanagement.component.assetInventory.controller.assetInventory.FormEdit",
            {
                onInit() {
                    this.oModel = this.getOwnerComponent().getModel("ModelFormEdit");
                    this.getView().setModel(this.oModel);

                    this.fnInitController();

                    this._getRouter()
                        .getRoute("RouteFormEdit")
                        .attachMatched(this._onRouteMatched, this);
                },

                _onRouteMatched: async function (oEvent) {
                    try {
                        Util.loader(true);
                        await this.fnClearFields();

                        // Obtener el ID desde los argumentos de la ruta
                        const sId = oEvent.getParameter("arguments").id;

                        // Aquí puedes usar el ID para realizar una consulta, por ejemplo:
                        const { URLService } = this.oModel.getProperty("/mConfigView");
                        const oResult = await RequestMethods.getById(URLService, sId);
                        this.oModel.setProperty("/mFormEdit", oResult.result);
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
                    this.oModel.setProperty("/mFormEdit", {
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
