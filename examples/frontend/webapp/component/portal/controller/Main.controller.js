sap.ui.define(
    [
        "com/mundocloud/assetmanagement/component/portal/base/Base.controller",
        "com/mundocloud/assetmanagement/component/portal/helper/DropGrid.helper",
    ],
    function (BaseController, DropGrid) {
        "use strict";

        return BaseController.extend(
            "com.mundocloud.assetmanagement.component.portal.controller.Main",
            {
                onInit: function () {
                    this._DropGrid = new DropGrid(this);

                    this._DropGrid.init();
                },
            },
        );
    },
);
