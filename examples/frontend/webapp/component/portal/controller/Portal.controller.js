sap.ui.define(
    [
        "com/mundocloud/assetmanagement/component/portal/base/Base.controller",
        "sap/ui/core/routing/History",
        "com/mundocloud/assetmanagement/component/portal/helper/ResizeDevice.helper",
    ],
    function (BaseController, History, ResizeDevice) {
        "use strict";

        return BaseController.extend(
            "com.mundocloud.assetmanagement.component.portal.controller.Portal",
            {
                onInit() {
                    this.oModel = this.getOwnerComponent().getModel("ModelPortal");
                    this.getView().setModel(this.oModel);

                    this.fnPrepareTheme();

                    this._resezeDevice = new ResizeDevice(this);

                    this._resezeDevice.fnConnectAttach();
                },

                onAfterRendering() {
                    this._fnAbleButtonNavBack();
                },

                onExit() {
                    this._resezeDevice.fnDisconectAttach();
                },

                _fnAbleButtonNavBack: function () {
                    const oHistory = History.getInstance();
                    const sPreviousHash = oHistory.getPreviousHash();
                    const oModelPortal = this.getView().getModel("ModelPortal");

                    if (sPreviousHash === undefined) {
                        if (oHistory.aHistory[0] === "") {
                            oModelPortal.setProperty("/showButtonNavBack", false);
                            oModelPortal.setProperty("/showFooter", true);
                            return;
                        }

                        oModelPortal.setProperty("/showFooter", false);
                        oModelPortal.setProperty("/showButtonNavBack", true);
                    }
                },

                fnPrepareTheme: function () {
                    const userTheme = localStorage.getItem("userThemePreference") || "sap_fiori_3";
                    sap.ui.getCore().applyTheme(userTheme);

                    this.oModel.setProperty("/appTheme", userTheme);
                },

                onProfilePress: function (oEvent) {
                    // Cargar el fragmento del menú si no existe
                    if (!this._oProfileMenu) {
                        this._oProfileMenu = sap.ui.xmlfragment(
                            "com.mundocloud.assetmanagement.component.portal.view.fragment.ProfileMenu",
                            this,
                        );
                        this.getView().addDependent(this._oProfileMenu);
                    }
                    // Mostrar el menú
                    this._oProfileMenu.openBy(oEvent.getSource());
                },

                onThemeChange: function (oEvent) {
                    const selectedTheme = oEvent.getSource().getSelectedKey();
                    sap.ui.getCore().applyTheme(selectedTheme);
                    localStorage.setItem("userThemePreference", selectedTheme);
                },
            },
        );
    },
);
