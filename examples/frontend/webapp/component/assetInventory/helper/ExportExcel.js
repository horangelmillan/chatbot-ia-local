sap.ui.define(
    [
        "sap/ui/base/Object",
        "sap/ui/model/odata/v4/ODataModel",
        "com/mundocloud/assetmanagement/component/masterData/helper/Util.helper",
    ],
    function (ObjectUI5, ODataModel, Util) {
        "use strict";

        return ObjectUI5.extend(
            "com.mundocloud.assetmanagement.component.masterData.helper.ExportExcel",
            {
                URLFragment:
                    "com.mundocloud.assetmanagement.component.masterData.view.fragments.ProgressBar",

                modelProgresBar: "/mExcelUtils/mProgresBar",
                modelTempOdata: "/mExcelUtils/mTempOdata",

                oPaginationParams: {
                    pageSize: 200,
                    currentPage: 1,
                    bExecProgresBar: false,
                    iCurrentCount: 0,
                },

                constructor: function (_oController) {
                    this._oController = _oController;
                },

                fnGetDataExport: async function (sIdMainTable) {
                    const vFilters =
                        this._oController.byId(sIdMainTable).getBinding("rows").aFilters || [];

                    let { sEntity, sODataPath, sODataParams } =
                        await this._fnGetPaths(sIdMainTable);
                    const oODataParams = await this._fnFormatParamsPath(sODataParams);

                    let { pageSize, currentPage, bExecProgresBar, iCurrentCount } =
                        this.oPaginationParams;

                    // Crear el modelo OData V4
                    this._ODataBinnacles = new ODataModel({
                        serviceUrl: "URL_ODATA_SERVICE",
                        synchronizationMode: "None", // Para el modo de sincronización, usa 'None'
                        operationMode: "Server", // Opcional: Si necesitas paginación en el lado del servidor
                        groupId: "$direct", // Importante: Esto deshabilita el uso de batch requests
                    });

                    const that = this;

                    return new Promise((resolve, reject) => {
                        async function readDataWithPagination() {
                            const skipValue = (currentPage - 1) * pageSize;

                            // Bind a una lista con paginación en OData V4
                            const oListBinding = that._ODataBinnacles.bindList(
                                sEntity,
                                undefined,
                                undefined,
                                vFilters,
                                oODataParams,
                            );

                            try {
                                const oData = await oListBinding.requestContexts(
                                    skipValue,
                                    pageSize,
                                );
                                let iTotal = 0;
                                if (oData[0] && oData[0].getBinding) {
                                    iTotal = oData[0].getBinding().iMaxLength;
                                }
                                const iCount = oData.length;
                                iCurrentCount += iCount;

                                const modelTempOdata = that._oController.oModel.getProperty(
                                    that.modelTempOdata,
                                );
                                modelTempOdata.push(...oData.map((context) => context.getObject()));
                                that._oController.oModel.setProperty(
                                    that.modelTempOdata,
                                    modelTempOdata,
                                );

                                if (iCount === pageSize) {
                                    const iPercent = await that._fnCalculatePercent(
                                        iCurrentCount,
                                        iTotal,
                                    );
                                    that._oController.oModel.setProperty(that.modelProgresBar, {
                                        valorProgreso: iPercent,
                                        valorProgresoString: iPercent.toString() + "%",
                                    });

                                    if (!bExecProgresBar) {
                                        that._fnOnOpenProgresBar();
                                        bExecProgresBar = true;
                                    }

                                    currentPage++;
                                    if (that._ODataBinnacles) {
                                        await readDataWithPagination();
                                    } else {
                                        that._fnResetModels();
                                        resolve(null);
                                    }
                                } else {
                                    // Si no hay más datos, resolver la Promesa con los datos completos
                                    const iPercent = await that._fnCalculatePercent(
                                        iCurrentCount,
                                        iTotal,
                                    );

                                    const iLastPercent = that._oController.oModel.getProperty(
                                        "/mExcelUtils/mProgresBar/valorProgreso",
                                    );

                                    const iPercentFinal = iPercent + iLastPercent;

                                    that._oController.oModel.setProperty(that.modelProgresBar, {
                                        valorProgreso: iPercentFinal,
                                        valorProgresoString: iPercentFinal.toString() + "%",
                                    });

                                    if (bExecProgresBar) {
                                        await that._fnOnCloseProgresBar();
                                        bExecProgresBar = false;
                                    }

                                    that._fnResetModels();
                                    if (that._ODataBinnacles) {
                                        resolve(modelTempOdata.flat());
                                    } else {
                                        resolve(null);
                                    }
                                }
                            } catch (oError) {
                                reject(oError);
                            }
                        }

                        readDataWithPagination();
                    });
                },

                _fnGetPaths: function (sIdMainTable) {
                    const oDataListBinding = this._oController
                        .byId(sIdMainTable)
                        .getBinding("rows");
                    const sPathPortal = this._oController
                        .getOwnerComponent()
                        .getManifestObject()
                        ._oBaseUri.pathname();

                    const arrPath = oDataListBinding.getDownloadUrl().slice(1).split("/");
                    const sPatFull = arrPath.pop();

                    const iParamsIndex = sPatFull.indexOf("?");
                    const sParamsPath = sPatFull.slice(iParamsIndex + 1);

                    return Promise.resolve({
                        sODataPath: sPathPortal + arrPath.join("/"),
                        sEntity: iParamsIndex
                            ? "/" + sPatFull.slice(0, iParamsIndex)
                            : "/" + sPatFull,
                        sODataParams: sParamsPath,
                    });
                },

                _fnFormatParamsPath: function (sODataParams) {
                    const oODataParams = {};

                    const aODataParams = sODataParams.split("$");
                    aODataParams.shift();

                    for (const sParam of aODataParams) {
                        const destructure = sParam.split("=");

                        oODataParams[`$${destructure[0]}`] = decodeURIComponent(
                            destructure[1],
                        ).replace("&", "");
                    }

                    return Promise.resolve(oODataParams);
                },

                _fnCalculatePercent: function (iCount, iTotal) {
                    const iPercent = Math.round((iCount / iTotal) * 100);

                    return Promise.resolve(iPercent);
                },

                _fnOnOpenProgresBar: async function () {
                    try {
                        if (!this._oController.fragmentProgresBar) {
                            this._oController.fragmentProgresBar =
                                await this._oController.loadFragment({
                                    name: this.URLFragment,
                                });
                        }

                        await this._oController.fragmentProgresBar.open();
                    } catch (error) {
                        console.log("Ocurrió un error al abrir el fragmento: " + error);
                    }
                },

                _fnOnCloseProgresBar: async function () {
                    try {
                        this._fnResetModels();

                        const result = await this._oController.fragmentProgresBar.destroy();
                        this._oController.fragmentProgresBar = undefined;

                        return Promise.resolve(result);
                    } catch (error) {
                        console.log("Ocurrió un error al destruir el fragmento: ", error);
                        Util.onShowMessage(error.message, "error", null, null);
                    }
                },

                _fnResetModels: function () {
                    this._oController.oModel.setProperty(this.modelTempOdata, []);

                    this._oController.oModel.setProperty(this.modelProgresBar, {
                        valorProgreso: 0,
                        valorProgresoString: "0",
                    });
                },

                fnOnCancelExportExcel: async function () {
                    if (this._ODataBinnacles) {
                        this._ODataBinnacles.destroy();
                        this._ODataBinnacles = null;

                        await this._fnOnCloseProgresBar();
                    }
                },
            },
        );
    },
);
