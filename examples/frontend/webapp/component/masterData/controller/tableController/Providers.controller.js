sap.ui.define(
    ["com/mundocloud/assetmanagement/component/masterData/base/Base.controller"],
    function (BaseController) {
        "use strict";

        return BaseController.extend(
            "com.mundocloud.assetmanagement.component.masterData.controller.tableController.Providers",
            {
                onInit() {
                    this.oModel = this.getOwnerComponent().getModel("ModelProviders");
                    this.getView().setModel(this.oModel);
                },

                onAfterClose: async function (oEvent) {
                    this._oDialogHelper.fnDestroyFragment("oDialogCreate", "/mFormCreate");
                    this.oModel.setProperty("/mFormCreate", {});
                },

                onAfterCloseEdit: async function (oEvent) {
                    this._oDialogHelper.fnDestroyFragment("oDialogEdit", "/mFormEdit");
                    this.oModel.setProperty("/mFormEdit", {});
                },
            },
        );
    },
);
