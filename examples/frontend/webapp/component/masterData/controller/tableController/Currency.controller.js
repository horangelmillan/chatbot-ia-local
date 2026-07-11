sap.ui.define(
    ["com/mundocloud/assetmanagement/component/masterData/base/Base.controller"],
    function (BaseController) {
        "use strict";

        return BaseController.extend(
            "com.mundocloud.assetmanagement.component.masterData.controller.tableController.Currency",
            {
                onInit() {
                    this.oModel = this.getOwnerComponent().getModel("ModelCurrency");
                    this.getView().setModel(this.oModel);
                },
            },
        );
    },
);
