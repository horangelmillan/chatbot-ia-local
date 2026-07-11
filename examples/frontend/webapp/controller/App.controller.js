sap.ui.define(["com/mundocloud/assetmanagement/base/Base.controller"], function (BaseController) {
    "use strict";

    return BaseController.extend("com.mundocloud.assetmanagement.controller.App", {
        onInit() {
            this.oModel = this.getOwnerComponent().getModel("ModelApp");
            this.getView().setModel(this.oModel);
        },
    });
});
