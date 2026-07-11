sap.ui.define(
    ["com/mundocloud/assetmanagement/component/masterData/base/Base.controller"],
    function (BaseController) {
        "use strict";

        return BaseController.extend(
            "com.mundocloud.assetmanagement.component.masterData.controller.tableController.Log",
            {
                onInit() {
                    this.oModel = this.getOwnerComponent().getModel("ModelLog");
                    this.getView().setModel(this.oModel);
                },
            },
        );
    },
);
