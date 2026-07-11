sap.ui.define(
    ["com/mundocloud/assetmanagement/component/masterData/base/Base.controller"],
    function (BaseController) {
        "use strict";

        return BaseController.extend(
            "com.mundocloud.assetmanagement.component.masterData.controller.tableController.LogisticsCenters",
            {
                onInit() {
                    this.oModel = this.getOwnerComponent().getModel("ModelLogisticsCenters");
                    this.getView().setModel(this.oModel);
                },

                onAfterOpenDialog: function () {
                    this.fnAddValidatorMI();

                    const oCriterios = this.oModel.getProperty("/mFormEdit/criterios");
                    const aCriteria = this.oModel.getProperty("/mCriteria");
                    const oMultiInputCreate = this.byId("multiInputCriteriaCreate");
                    const oMultiInputEdit = this.byId("multiInputCriteriaEdit");

                    for (const oInput of [oMultiInputCreate, oMultiInputEdit]) {
                        if (oInput)
                            for (const key in oCriterios) {
                                if (key.includes("criterio_") && oCriterios[key]) {
                                    aCriteria.push({
                                        key: oCriterios[key],
                                        text: oCriterios[key],
                                    });
                                    oInput.addToken(
                                        new sap.m.Token({
                                            key: oCriterios[key],
                                            text: oCriterios[key],
                                        }),
                                    );
                                    this.oModel.setProperty("/mCriteria", aCriteria);
                                }
                            }
                    }
                },

                onFormatToToken: function (oEvent) {
                    console.log(oEvent);
                },
            },
        );
    },
);
