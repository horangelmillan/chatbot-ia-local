sap.ui.define(
    ["com/mundocloud/assetmanagement/component/masterData/base/Base.controller"],
    function (BaseController) {
        "use strict";

        return BaseController.extend(
            "com.mundocloud.assetmanagement.component.masterData.controller.tableController.CostCenter",
            {
                onInit() {
                    this.oModel = this.getOwnerComponent().getModel("ModelCostCenter");
                    this.getView().setModel(this.oModel);
                },
            },
        );
    },
);
