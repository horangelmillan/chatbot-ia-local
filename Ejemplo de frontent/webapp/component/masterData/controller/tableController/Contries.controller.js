sap.ui.define(
    ["com/mundocloud/assetmanagement/component/masterData/base/Base.controller"],
    function (BaseController) {
        "use strict";

        return BaseController.extend(
            "com.mundocloud.assetmanagement.component.masterData.controller.tableController.Contries",
            {
                onInit() {
                    this.oModel = this.getOwnerComponent().getModel("ModelCountries");
                    this.getView().setModel(this.oModel);
                },
            },
        );
    },
);
