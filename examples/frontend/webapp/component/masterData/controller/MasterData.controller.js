sap.ui.define(
    [
        "com/mundocloud/assetmanagement/component/masterData/base/Base.controller",
        "com/mundocloud/assetmanagement/component/masterData/helper/ToolPage.helper",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
    ],
    function (BaseController, ToolPageHelper, Filter, FilterOperator) {
        "use strict";

        return BaseController.extend(
            "com.mundocloud.assetmanagement.component.masterData.controller.MasterData",
            {
                _toolPageHelper: null,
                oModel: null,

                onInit() {
                    this.oModel = this.getOwnerComponent().getModel("ModelComponent");
                    this.getView().setModel(this.oModel);

                    this._toolPageHelper = new ToolPageHelper(this);
                },

                onAfterRendering: function () {
                    this._selectNavigationItemWithRouterOnLoad();
                },

                _selectNavigationItemWithRouterOnLoad: function () {
                    const sNameRouter = this._getCurrentRouterName();
                    const arrNavigationItems = this.oModel.getProperty("/ToolPage/navigation");
                    const oNavigationItem = arrNavigationItems.find(
                        (ni) => ni.route === sNameRouter,
                    );

                    if (!oNavigationItem) return;

                    this.oModel.setProperty("/ToolPage/selectedKey", oNavigationItem.key);
                },

                _getCurrentRouterName: function () {
                    let oRouter = this.getOwnerComponent().getRouter();
                    const sCurrentHash = oRouter.getHashChanger().getHash();
                    const oInfoHash = oRouter.getRouteInfoByHash(sCurrentHash);
                    if (oInfoHash) {
                        return oInfoHash.name;
                    }
                    return "";
                },

                onSideNavButtonPress: function (oEvent) {
                    this._toolPageHelper.onSideNavButtonPress();
                },

                onItemSelect: function (oEvent) {
                    this._toolPageHelper.onItemSelect(oEvent);
                },

                onSearch: function (oEvent) {
                    let sQuery = oEvent.getSource().getValue();

                    this.byId("navigationList")
                        .getBinding("items")
                        .filter(
                            new Filter(
                                [
                                    new Filter({
                                        path: "title",
                                        operator: FilterOperator.Contains,
                                        value1: sQuery,
                                        caseSensitive: false,
                                    }),
                                ],
                                false,
                            ),
                            "Application",
                        );
                },
            },
        );
    },
);
