sap.ui.define(["sap/ui/base/ManagedObject", "sap/ui/Device"], function (ManagedObject, Device) {
    "use strict";

    return ManagedObject.extend(
        "com.mundocloud.assetmanagement.component.portal.helper.ResizeDevice.helper",
        {
            constructor: function (oController) {
                this._oController = oController;
            },

            fnConnectAttach: function () {
                // Llamar a la función para ajustar la altura en la carga inicial
                this._adjustAppHeight();

                // Registrar el listener para cambios de tamaño
                Device.resize.attachHandler(this._adjustAppHeight, this);
            },

            _adjustAppHeight: function () {
                const oApp = this._oController.byId("appPortal");
                if (Device.resize.width > 500) {
                    oApp.setHeight("95.4vh");
                } else {
                    oApp.setHeight("94vh");
                }
            },

            fnDisconectAttach: function () {
                // Desconectar el listener cuando el controlador termine su ciclo de vida
                Device.resize.detachHandler(this._adjustAppHeight, this);
            },
        },
    );
});
