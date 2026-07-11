sap.ui.define(
    [
        "com/mundocloud/assetmanagement/component/assetInventory/base/Base.controller",
        "com/mundocloud/assetmanagement/component/assetInventory/helper/Util.helper",
    ],
    function (BaseController, Util) {
        "use strict";

        return BaseController.extend(
            "com.mundocloud.assetmanagement.component.assetInventory.controller.Main",
            {
                onInit() {
                    this.oModel = this.getOwnerComponent().getModel("ModelMain");
                    this.getView().setModel(this.oModel);

                    this.fnInitController();

                    this._getRouter()
                        .getRoute("RouteMain")
                        .attachMatched(this._onRouteMatched, this);
                },

                onOpenFormEdit: function (oEvent) {
                    const sId = oEvent.getSource().getText();
                    this.onNavTo("RouteFormEdit", sId);
                },

                _onRouteMatched: function () {
                    try {
                        Util.loader(true);
                        this.onRefresh();
                    } catch (error) {
                        console.log(error);
                    } finally {
                        Util.loader(false);
                    }
                },

                formatDateTime: function (date) {
                    if (!date) return "";

                    // Convierte la fecha a un objeto Date y la formatea a "YYYY-MM-DD HH:mm:ss"
                    return new Date(date).toLocaleDateString("es-CO", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        second: "2-digit",
                        minute: "2-digit",
                        hour: "2-digit",
                        timeZone: "America/Bogota", // Reemplaza "-5:00" por un identificador válido
                        timeZoneName: "short",
                    });
                },
            },
        );
    },
);
