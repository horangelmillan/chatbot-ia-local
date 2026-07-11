sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "com/mundocloud/assetmanagement/component/assetInventory/helper/Util.helper",
        "com/mundocloud/assetmanagement/component/assetInventory/helper/Dialogs.helper",
        "com/mundocloud/assetmanagement/component/assetInventory/helper/ExportExcel",
        "com/mundocloud/assetmanagement/component/assetInventory/helper/InputsValidator.helper",
        "com/mundocloud/assetmanagement/component/assetInventory/helper/RequestMethods.helper",
        "com/mundocloud/assetmanagement/component/assetInventory/helper/Filter.helper",
        "com/mundocloud/assetmanagement/component/masterData/lib/SheetJS",
        "sap/m/Token",
        "sap/ui/core/routing/History",
        "sap/ui/core/UIComponent",
    ],
    function (
        Controller,
        Util,
        Dialogs,
        ExportExcelHelper,
        InputsValidatorHelper,
        RequestMethods,
        Filter,
        SheetJS,
        Token,
        History,
        UIComponent,
    ) {
        "use strict";

        return Controller.extend(
            "com.mundocloud.assetmanagement.component.assetInventory.base.Base",
            {
                filterHelper: new Filter(),

                onShowModels: function () {
                    console.log(this.oModel);
                },

                fnInitController: function () {
                    // Logica para abrir dialogos
                    this._oDialogHelper = new Dialogs(this);

                    // Logica para validar los campos
                    this._oValidator = new InputsValidatorHelper(this);

                    // Logica para descargar datos paginados por odata.
                    this.exportExcelHelper = new ExportExcelHelper(this);
                    this.oModel.setProperty("/mExcelUtils", {
                        mProgresBar: {
                            valorProgreso: 0,
                            valorProgresoString: "0",
                        },
                        mTempOdata: [],
                    });
                },

                async onAfterRendering(oEvent) {
                    try {
                        Util.loader(true);

                        this.oModel.setProperty("/mExcelUtils", {
                            mProgresBar: {
                                valorProgreso: 0,
                                valorProgresoString: "0",
                            },
                            mTempOdata: [],
                        });
                    } catch (error) {
                        console.log(error);
                    } finally {
                        Util.loader(false);
                    }
                },

                onOpenProvidersCreate: function () {},

                formatToISOString: function (date) {
                    if (!date) return null;
                    const oDate = new Date(date);
                    return oDate.toISOString(); // Convierte la fecha al formato ISO
                },

                onOpenDialogCreate: function () {
                    const { URIFragmentFolder } = this.oModel.getProperty("/mConfigView");
                    this._oDialogHelper.fnOpenDialog(
                        "oDialogCreate",
                        `com.mundocloud.assetmanagement.component.assetInventory.view.fragments.${URIFragmentFolder}.formCreate`,
                    );
                },

                onOpenDialogCreateProvider: function () {
                    const { URIFragmentFolder } = this.oModel.getProperty("/mConfigView");
                    this._oDialogHelper.fnOpenDialog(
                        "oDialogCreate",
                        `com.mundocloud.assetmanagement.component.assetInventory.view.fragments.FormCreateProvider`,
                    );
                },

                onAfterOpenDialog: async function (oEvent) {
                    try {
                        Util.loader(true);

                        /* const result = await this._permissionsHelper.getDialogPermissions(oEvent); */
                    } catch (oError) {
                        console.log(oError);
                    } finally {
                        Util.loader(false);
                    }
                },

                onOpenDialogEdit: async function (oEvent) {
                    try {
                        Util.loader(true);
                        const { URIFragmentFolder, URLService } =
                            this.oModel.getProperty("/mConfigView");
                        const oRow = oEvent.getSource().getBindingContext("odata").getObject();
                        const oResult = await RequestMethods.getById(URLService, oRow.id);
                        this.oModel.setProperty("/mFormEdit", oResult.result);

                        this._oDialogHelper.fnOpenDialog(
                            "oDialogEdit",
                            `com.mundocloud.assetmanagement.component.assetInventory.view.fragments.${URIFragmentFolder}.formEdit`,
                        );
                    } catch (oError) {
                        console.log(oError);
                        Util.onShowMessage(
                            `Ocurrio un error al abrir la edición: ${oError.responseText}, ${oError.statusText}`,
                            "error",
                            null,
                            null,
                        );
                    } finally {
                        Util.loader(false);
                    }
                },

                onCloseDialog: function (sIdFragment) {
                    this.byId(sIdFragment).close();
                },

                onAfterClose: async function (oEvent) {
                    this._oDialogHelper.fnDestroyFragment("oDialogCreate", "/mFormCreate");
                },

                onAfterCloseEdit: async function (oEvent) {
                    this._oDialogHelper.fnDestroyFragment("oDialogEdit", "/mFormEdit");
                    /* this.oModel.setProperty("/mConfigView/mEditMode", false); */
                },

                onAfterCloseProviders: async function (oEvent) {
                    this._oDialogHelper.fnDestroyFragment(
                        "oDialogCreate",
                        "/mProvider/mFormCreate",
                    );
                    this.oModel.setProperty("/mProvider", {
                        mFormCreate: {},
                        mFormEdit: {},
                        idFragment: "FragmentProviders",
                        URLService: "/core/people/providers",
                    });
                },

                onExportExcel: async function () {
                    try {
                        Util.loader(false);
                        const { idTable, fileName } = this.oModel.getProperty("/mConfigExcel");

                        const oTable = this.byId(idTable);
                        const aColumns = oTable.getColumns();

                        // Obtener cabeceras (textos de los Labels)
                        const aHeaders = aColumns.map((oColumn) => {
                            const oLabel = oColumn.getLabel();
                            return oLabel ? oLabel.getText() : "";
                        });

                        const aData = await this.exportExcelHelper.fnGetDataExport(idTable);

                        if (!aData) return;

                        // Crear un mapeo de columnas y sus posibles formatters
                        const aColumnConfig = aColumns.map((oColumn) => {
                            const sProperty = oColumn.mProperties.filterProperty;
                            const oTemplate = oColumn.getTemplate();

                            // Verificar si el template tiene un `formatter`
                            let oFormatter = null;
                            if (oTemplate && oTemplate.getBindingInfo("text")) {
                                oFormatter = oTemplate.getBindingInfo("text").formatter;
                            }

                            return {
                                property: sProperty,
                                formatter: oFormatter, // Puede ser `null` si no hay formatter
                            };
                        });

                        // Formatear los datos según el mapeo de columnas
                        const aExcelData = [aHeaders]; // Primera fila para los encabezados
                        aData.forEach((oRow) => {
                            const aRow = aColumnConfig.map((oColumnConfig) => {
                                const { property, formatter } = oColumnConfig;

                                // Si hay un formatter, aplicarlo
                                if (formatter && typeof formatter === "function") {
                                    return formatter(oRow[property]);
                                }

                                // Si no hay formatter, devolver el valor sin procesar
                                return oRow[property] || "";
                            });
                            aExcelData.push(aRow);
                        });

                        // Crear hoja desde un array de arrays (aoa)
                        const ws = XLSX.utils.aoa_to_sheet(aExcelData);

                        // Ajustar ancho de columnas
                        const columnWidths = aExcelData[0].map((header, colIndex) => {
                            const maxContentLength = Math.max(
                                header.length,
                                ...aExcelData
                                    .slice(1)
                                    .map((row) =>
                                        row[colIndex] ? row[colIndex].toString().length : 0,
                                    ),
                            );
                            return { width: maxContentLength + 2 };
                        });
                        ws["!cols"] = columnWidths;

                        // Crear libro de trabajo y agregar la hoja
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, "Datos");

                        // Genera el archivo Excel y lo descarga
                        XLSX.writeFile(wb, `${fileName}.xlsx`);
                    } catch (oError) {
                        console.error(oError);
                        Util.onShowMessage(
                            "Ocurrió un error al exportar los datos. Detalles: " + oError.message,
                            "error",
                            null,
                            null,
                        );
                    } finally {
                        Util.loader(false);
                    }
                },

                fnOnCancelExportExcel: async function () {
                    await this.exportExcelHelper.fnOnCancelExportExcel();
                },

                onSave: async function () {
                    try {
                        Util.loader(true);
                        const isValidFields = await this._oValidator.validateFields(null);
                        const { URLService, idTable } = this.oModel.getProperty("/mConfigView");

                        if (!isValidFields) {
                            Util.onShowMessage(
                                "Verifique los campos obligatorios",
                                "toast",
                                null,
                                null,
                            );
                            return;
                        }

                        let oJsonSend = this.oModel.getProperty("/mFormCreate");
                        oJsonSend = this.removeMatchingProperties(oJsonSend);
                        const oResponse = await RequestMethods.post(
                            await this._fnFormatJson(oJsonSend),
                            URLService,
                        );

                        this.oModel.setProperty("/mFormCreate", {
                            excludes: {},
                            activo: {},
                        });

                        Util.onShowMessage(
                            oResponse.message,
                            "done",
                            async () => {
                                await this.fnClearFields();
                                this.onNavBack();
                            },
                            null,
                        );
                    } catch (oError) {
                        let oMessage = oError.responseText;
                        let oClassError = oError.statusText;

                        try {
                            // Intentamos parsear el mensaje de error en JSON
                            const oErrorMessage = JSON.parse(oError.responseText);
                            oMessage = oErrorMessage?.message;
                            oClassError = oErrorMessage?.classError;

                            // Extraemos los mensajes de validación específicos
                            const validationErrors = this._extractValidationMessages(
                                oErrorMessage.results,
                            );

                            if (validationErrors.length) {
                                oMessage = validationErrors.join(", ");
                            }
                        } catch {}

                        Util.onShowMessage(
                            `Ocurrió un error al guardar: ${oMessage}, ${oClassError}`,
                            "error",
                            null,
                            null,
                        );
                    } finally {
                        Util.loader(false);
                    }
                },

                _fnFormatJson: async function (json) {
                    const mConfigForm = this.oModel.getProperty("/mConfigForm");

                    const formatObject = (obj) => {
                        for (const key in obj) {
                            if (typeof obj[key] === "string") {
                                if (mConfigForm.toUperCaseAll) {
                                    if (
                                        !mConfigForm.noToUperCase || // Si no hay excepciones configuradas
                                        !mConfigForm.noToUperCase.includes(key) // Si la clave no está en las excepciones
                                    ) {
                                        obj[key] = obj[key].toUpperCase();
                                    }
                                }
                            } else if (typeof obj[key] === "object" && obj[key] !== null) {
                                // Llamada recursiva para objetos anidados
                                formatObject(obj[key]);
                            }
                        }
                        return obj;
                    };

                    return formatObject(json);
                },

                onSaveProvider: async function () {
                    try {
                        Util.loader(true);
                        const isValidFields = await this._oValidator.validateFields(null);
                        const { URLService, idFragment } = this.oModel.getProperty("/mProvider");

                        if (!isValidFields) {
                            Util.onShowMessage(
                                "Verifique los campos obligatorios",
                                "toast",
                                null,
                                null,
                            );
                            return;
                        }

                        const oJsonSend = this.oModel.getProperty("/mProvider/mFormCreate");
                        const oResponse = await RequestMethods.post(
                            await this._fnFormatJson(oJsonSend),
                            URLService,
                        );

                        this.oModel.setProperty("/mProvider/mFormCreate", {
                            persona: {},
                            cuenta: {},
                        });

                        Util.onShowMessage(oResponse.message, "done");
                        this.onCloseDialog(idFragment);
                    } catch (oError) {
                        let oMessage = oError.responseText;
                        let oClassError = oError.statusText;

                        try {
                            // Intentamos parsear el mensaje de error en JSON
                            const oErrorMessage = JSON.parse(oError.responseText);
                            oMessage = oErrorMessage?.message;
                            oClassError = oErrorMessage?.classError;

                            // Extraemos los mensajes de validación específicos
                            const validationErrors = this._extractValidationMessages(
                                oErrorMessage.results,
                            );

                            if (validationErrors.length) {
                                oMessage = validationErrors.join(", ");
                            }
                        } catch {}

                        Util.onShowMessage(
                            `Ocurrió un error al guardar: ${oMessage}, ${oClassError}`,
                            "error",
                            null,
                            null,
                        );
                    } finally {
                        Util.loader(false);
                    }
                },

                /**
                 * Función auxiliar para extraer mensajes de validación específicos
                 * @param {Array} results - Array de resultados con errores de validación
                 * @returns {Array} - Lista de mensajes de error formateados
                 */
                _extractValidationMessages: function (results) {
                    const messages = [];

                    function traverseErrors(errorArray) {
                        errorArray.forEach((error) => {
                            if (error.constraints) {
                                // Añadimos cada mensaje de constraint al array de mensajes
                                for (const [constraint, message] of Object.entries(
                                    error.constraints,
                                )) {
                                    messages.push(message);
                                }
                            }
                            if (error.children && error.children.length > 0) {
                                // Si hay hijos, recorremos recursivamente para obtener sus mensajes
                                traverseErrors(error.children);
                            }
                        });
                    }

                    traverseErrors(results);
                    return messages;
                },

                onEdit: async function () {
                    try {
                        Util.loader(true);
                        const isValidFields = await this._oValidator.validateFields(null);
                        const { idTable, URLService } = this.oModel.getProperty("/mConfigView");

                        if (!isValidFields) {
                            return Util.onShowMessage(
                                "Verifique los campos obligatorios",
                                "toast",
                                null,
                                null,
                            );
                        }

                        let oJsonSend = Object.assign({}, this.oModel.getProperty("/mFormEdit"));
                        const iId = oJsonSend.id;
                        delete oJsonSend.id;
                        oJsonSend = this.removeMatchingProperties(oJsonSend);
                        const oResponse = await RequestMethods.put(
                            iId,
                            URLService,
                            await this._fnFormatJson(oJsonSend),
                        );
                        Util.onShowMessage(oResponse.message, "done", null, null);
                        this.oModel.setProperty("/mFormEdit", {
                            activo: {},
                        });
                        Util.onShowMessage(
                            oResponse.message,
                            "done",
                            async () => {
                                this.onNavBack();
                            },
                            null,
                        );
                    } catch (oError) {
                        let oMessage = oError.responseText;
                        let oClassError = oError.statusText;

                        try {
                            // Intentamos parsear el mensaje de error en JSON
                            const oErrorMessage = JSON.parse(oError.responseText);
                            oMessage = oErrorMessage?.message;
                            oClassError = oErrorMessage?.classError;

                            // Extraemos los mensajes de validación específicos
                            const validationErrors = this._extractValidationMessages(
                                oErrorMessage.results,
                            );

                            if (validationErrors.length) {
                                oMessage = validationErrors.join(", ");
                            }
                        } catch {}

                        Util.onShowMessage(
                            `Ocurrió un error al editar: ${oMessage}, ${oClassError}`,
                            "error",
                            null,
                            null,
                        );
                    } finally {
                        Util.loader(false);
                    }
                },

                onValidateFieldFromFragment: async function (sIdInput) {
                    if (this.currentInputOpenList) {
                        await this._oValidator.validateField(this.currentInputOpenList);
                        this.currentInputOpenList = null;
                        return;
                    }
                    await this._oValidator.validateField(sIdInput);
                },

                onValidateField: async function (oEvent) {
                    const oInput = oEvent.getSource();
                    await this._oValidator.validateField(oInput);
                },

                onSearch: function (oEvent) {
                    const { idTable, mColumnsSearch } = this.oModel.getProperty("/mConfigView");
                    const sValue = oEvent.getSource().getValue();

                    const oTable = this.byId(idTable);
                    const oRows = oTable.getBinding("rows");

                    const filters = this.filterHelper.generateFilter(sValue, mColumnsSearch);

                    oRows.filter(filters, "Application");
                },
                onRefresh: function () {
                    const { idTable } = this.oModel.getProperty("/mConfigView");

                    const oTable = this.byId(idTable);
                    oTable.getBinding("rows").refresh();
                },

                onUpdateMultiInput: function (oEvent, oAddCriteria) {
                    const sIdMultiInput = oEvent.getSource().getId();
                    const sModelCriteria =
                        (sIdMultiInput.includes("Create") ? "/mFormCreate" : "/mFormEdit") +
                        "/criterios";
                    let aCriteria = this.oModel.getProperty(sModelCriteria);

                    if (!aCriteria) {
                        this.oModel.setProperty(sModelCriteria, []);

                        aCriteria = this.oModel.getProperty(sModelCriteria);
                    }

                    const sType = oEvent.getParameter("type"),
                        aAddedTokens = oEvent.getParameter("addedTokens"),
                        aRemovedTokens = oEvent.getParameter("removedTokens");

                    switch (sType) {
                        // add new context to the data of the model, when new token is being added
                        case "added":
                            aAddedTokens.forEach(function (oToken) {
                                aCriteria.push({ key: oToken.getKey(), text: oToken.getText() });
                            });
                            break;
                        // remove contexts from the data of the model, when tokens are being removed
                        case "removed":
                            aRemovedTokens.forEach(function (oToken) {
                                aCriteria = aCriteria.filter(function (oContext) {
                                    return oContext.key != oToken.getKey();
                                });
                            });
                            break;
                        default:
                            break;
                    }

                    if (oAddCriteria) {
                        aCriteria.push(oAddCriteria);
                    }

                    this.oModel.setProperty(sModelCriteria, aCriteria);
                },

                _getRouter: function () {
                    return UIComponent.getRouterFor(this);
                },

                onNavBack: function () {
                    const oHistory = History.getInstance();
                    const sPreviousHash = oHistory.getPreviousHash();

                    if (sPreviousHash !== undefined) {
                        window.history.go(-1);
                    } else {
                        this._getRouter().navTo("RouteMain", {}, {}, true);
                    }
                },

                removeMatchingProperties: function (target) {
                    const oExcludesProperties = this.oModel.getProperty("/mExcludesProperties");

                    if (!oExcludesProperties) return target;

                    for (const key of Object.keys(oExcludesProperties)) {
                        // Si la propiedad existe en target, eliminarla
                        if (key in target) {
                            delete target[key];
                        }
                    }
                    return target;
                },

                onNavTo: function (sRoute, sId) {
                    const oHistory = History.getInstance();
                    const sPreviousHash = oHistory.getPreviousHash();

                    if (oHistory.aHistory.length === 1 && sPreviousHash !== undefined) {
                        window.history.go(-1);
                    } else {
                        this._getRouter().navTo(sRoute, sId ? { id: sId } : {}, {}, false);
                    }
                },

                onOpenAssetClassList: async function (oEvent, sDialog, sHelpDialog, sModel) {
                    this.currentInputOpenList = oEvent.getSource();
                    this._oDialogHelper.fnOpenHelpDialog({
                        sDialog,
                        sHelpDialog,
                        /* fnInitFilter: () => {
                            const sBusinessValue = this.oModel.getProperty(
                                sModel + "/id_empresa_hana"
                            );

                            const oFilter = new Filter({
                                path: "cod_empresa",
                                operator: FilterOperator.EQ,
                                value1: sBusinessValue,
                            });

                            return [oFilter];
                        }, */
                        fnDataContext: (aDataContext) => {
                            for (const dataContext of aDataContext) {
                                const { id, codigo, descripcion } = dataContext.getObject();

                                const sModelTemp = sModel.includes("activo")
                                    ? "/" + sModel.split("/")[1]
                                    : "/" + sModel.split("/")[1];

                                this.oModel.setProperty(
                                    sModelTemp + "/excludes/descripcion_clase_activo",
                                    descripcion,
                                );
                                this.oModel.setProperty(sModel + "/id_clase_activo", id);
                            }
                        },
                        fnSearchFilter: (sValue) => {
                            const aColumnsN = [["codigo", 8], ["id"]];
                            const aColumnsS = [["descripcion", 50]];

                            const filters = this.filterHelper.generateFilter(sValue, {
                                aColumnsS,
                                aColumnsN,
                            });

                            return filters;
                        },
                        oLoadParams: {
                            name:
                                this.oModel.getProperty("/mConfigView/URLFragments") + sHelpDialog,
                            addToDependents: false,
                        },
                    });
                },

                onOpenSocietiesList: async function (oEvent, sDialog, sHelpDialog, sModel) {
                    this.currentInputOpenList = oEvent.getSource();
                    this._oDialogHelper.fnOpenHelpDialog({
                        sDialog,
                        sHelpDialog,
                        /* fnInitFilter: () => {
                            const sBusinessValue = this.oModel.getProperty(
                                sModel + "/id_empresa_hana"
                            );

                            const oFilter = new Filter({
                                path: "cod_empresa",
                                operator: FilterOperator.EQ,
                                value1: sBusinessValue,
                            });

                            return [oFilter];
                        }, */
                        fnDataContext: (aDataContext) => {
                            for (const dataContext of aDataContext) {
                                const { id, codigo, descripcion } = dataContext.getObject();

                                const sModelTemp = sModel.includes("activo")
                                    ? "/" + sModel.split("/")[1]
                                    : "/" + sModel.split("/")[1];

                                this.oModel.setProperty(
                                    sModelTemp + "/excludes/descripcion_sociedad",
                                    descripcion,
                                );
                                this.oModel.setProperty(sModel + "/id_sociedad", id);
                            }
                        },
                        fnSearchFilter: (sValue) => {
                            const aColumnsN = [["codigo", 4], ["id"]];
                            const aColumnsS = [["descripcion", 50]];

                            const filters = this.filterHelper.generateFilter(sValue, {
                                aColumnsS,
                                aColumnsN,
                            });

                            return filters;
                        },
                        oLoadParams: {
                            name:
                                this.oModel.getProperty("/mConfigView/URLFragments") + sHelpDialog,
                            addToDependents: false,
                        },
                    });
                },

                onOpenCostCentersList: async function (oEvent, sDialog, sHelpDialog, sModel) {
                    this.currentInputOpenList = oEvent.getSource();
                    this._oDialogHelper.fnOpenHelpDialog({
                        sDialog,
                        sHelpDialog,
                        /* fnInitFilter: () => {
                            const sBusinessValue = this.oModel.getProperty(
                                sModel + "/id_empresa_hana"
                            );

                            const oFilter = new Filter({
                                path: "cod_empresa",
                                operator: FilterOperator.EQ,
                                value1: sBusinessValue,
                            });

                            return [oFilter];
                        }, */
                        fnDataContext: (aDataContext) => {
                            for (const dataContext of aDataContext) {
                                const { id, descripcion, nombre_responsable, id_responsable } =
                                    dataContext.getObject();

                                const sModelTemp = sModel.includes("activo")
                                    ? "/" + sModel.split("/")[1]
                                    : "/" + sModel.split("/")[1];

                                this.oModel.setProperty(
                                    sModelTemp + "/excludes/descripcion_centro_costo",
                                    descripcion,
                                );
                                this.oModel.setProperty(sModel + "/id_centro_costo", id);

                                /* Automaticamente se llena el campo de responsable de activo fijo con el mismo responsable de centro de costo */

                                this.oModel.setProperty(
                                    sModelTemp + "/excludes/nombre_responsable_activo",
                                    nombre_responsable,
                                );
                                this.oModel.setProperty(
                                    sModel + "/activo/id_responsable",
                                    id_responsable,
                                );
                            }
                        },
                        fnSearchFilter: (sValue) => {
                            const aColumnsN = [["codigo", 10], ["id"]];
                            const aColumnsS = [
                                ["descripcion", 50],
                                ["nombre_responsable", 100],
                                ["cargo", 50],
                            ];

                            const filters = this.filterHelper.generateFilter(sValue, {
                                aColumnsS,
                                aColumnsN,
                            });

                            return filters;
                        },
                        oLoadParams: {
                            name:
                                this.oModel.getProperty("/mConfigView/URLFragments") + sHelpDialog,
                            addToDependents: false,
                        },
                    });
                },

                onOpenInternalOrdersList: async function (oEvent, sDialog, sHelpDialog, sModel) {
                    this.currentInputOpenList = oEvent.getSource();
                    this._oDialogHelper.fnOpenHelpDialog({
                        sDialog,
                        sHelpDialog,
                        /* fnInitFilter: () => {
                            const sBusinessValue = this.oModel.getProperty(
                                sModel + "/id_empresa_hana"
                            );

                            const oFilter = new Filter({
                                path: "cod_empresa",
                                operator: FilterOperator.EQ,
                                value1: sBusinessValue,
                            });

                            return [oFilter];
                        }, */
                        fnDataContext: (aDataContext) => {
                            for (const dataContext of aDataContext) {
                                const { id, codigo, descripcion } = dataContext.getObject();

                                const sModelTemp = sModel.includes("activo")
                                    ? "/" + sModel.split("/")[1]
                                    : "/" + sModel.split("/")[1];

                                this.oModel.setProperty(
                                    sModelTemp + "/excludes/descripcion_orden_interna",
                                    descripcion,
                                );
                                this.oModel.setProperty(sModel + "/id_orden_interna", id);
                            }
                        },
                        fnSearchFilter: (sValue) => {
                            const aColumnsN = [["codigo", 12], ["id"]];
                            const aColumnsS = [["descripcion", 50]];

                            const filters = this.filterHelper.generateFilter(sValue, {
                                aColumnsS,
                                aColumnsN,
                            });

                            return filters;
                        },
                        oLoadParams: {
                            name:
                                this.oModel.getProperty("/mConfigView/URLFragments") + sHelpDialog,
                            addToDependents: false,
                        },
                    });
                },

                onOpenLogisticsCentersList: async function (oEvent, sDialog, sHelpDialog, sModel) {
                    this.currentInputOpenList = oEvent.getSource();
                    this._oDialogHelper.fnOpenHelpDialog({
                        sDialog,
                        sHelpDialog,
                        /* fnInitFilter: () => {
                            const sBusinessValue = this.oModel.getProperty(
                                sModel + "/id_empresa_hana"
                            );

                            const oFilter = new Filter({
                                path: "cod_empresa",
                                operator: FilterOperator.EQ,
                                value1: sBusinessValue,
                            });

                            return [oFilter];
                        }, */
                        fnDataContext: (aDataContext) => {
                            for (const dataContext of aDataContext) {
                                const { id, codigo, descripcion, nombre_responsable } =
                                    dataContext.getObject();

                                const sModelTemp = sModel.includes("activo")
                                    ? "/" + sModel.split("/")[1]
                                    : "/" + sModel.split("/")[1];

                                this.oModel.setProperty(
                                    sModelTemp + "/excludes/descripcion_centro_logistico",
                                    descripcion,
                                );
                                this.oModel.setProperty(sModel + "/id_centro_logistico", id);
                            }
                        },
                        fnSearchFilter: (sValue) => {
                            const aColumnsN = [["codigo", 12], ["id"]];
                            const aColumnsS = [
                                ["descripcion", 50],
                                ["nombre_responsable", 100],
                            ];

                            const filters = this.filterHelper.generateFilter(sValue, {
                                aColumnsS,
                                aColumnsN,
                            });

                            return filters;
                        },
                        oLoadParams: {
                            name:
                                this.oModel.getProperty("/mConfigView/URLFragments") + sHelpDialog,
                            addToDependents: false,
                        },
                    });
                },

                onOpenCriteriaList: async function (oEvent, sDialog, sHelpDialog, sModel) {
                    this.currentInputOpenList = oEvent.getSource();
                    this._oDialogHelper.fnOpenHelpDialog({
                        sDialog,
                        sHelpDialog,
                        /* fnInitFilter: () => {
                            const sBusinessValue = this.oModel.getProperty(
                                sModel + "/id_empresa_hana"
                            );

                            const oFilter = new Filter({
                                path: "cod_empresa",
                                operator: FilterOperator.EQ,
                                value1: sBusinessValue,
                            });

                            return [oFilter];
                        }, */
                        fnDataContext: (aDataContext) => {
                            for (const dataContext of aDataContext) {
                                const { id, criterio } = dataContext.getObject();

                                oEvent.getSource().addToken(
                                    new sap.m.Token({
                                        key: criterio,
                                        text: criterio,
                                    }),
                                );

                                this.onUpdateMultiInput(oEvent, { key: criterio, text: criterio });
                            }
                        },
                        fnSearchFilter: (sValue) => {
                            const aColumnsN = [["id"]];
                            const aColumnsS = [["criterio", 4]];

                            const filters = this.filterHelper.generateFilter(sValue, {
                                aColumnsS,
                                aColumnsN,
                            });

                            return filters;
                        },
                        oLoadParams: {
                            name:
                                this.oModel.getProperty("/mConfigView/URLFragments") + sHelpDialog,
                            addToDependents: false,
                        },
                    });
                },

                onOpenUnitsMeasurementList: async function (oEvent, sDialog, sHelpDialog, sModel) {
                    this.currentInputOpenList = oEvent.getSource();
                    this._oDialogHelper.fnOpenHelpDialog({
                        sDialog,
                        sHelpDialog,
                        /* fnInitFilter: () => {
                            const sBusinessValue = this.oModel.getProperty(
                                sModel + "/id_empresa_hana"
                            );

                            const oFilter = new Filter({
                                path: "cod_empresa",
                                operator: FilterOperator.EQ,
                                value1: sBusinessValue,
                            });

                            return [oFilter];
                        }, */
                        fnDataContext: (aDataContext) => {
                            for (const dataContext of aDataContext) {
                                const { id, unidad, descripcion } = dataContext.getObject();

                                const sModelTemp = sModel.includes("activo")
                                    ? "/" + sModel.split("/")[1]
                                    : "/" + sModel.split("/")[1];

                                this.oModel.setProperty(
                                    sModelTemp + "/excludes/descripcion_unidad_medida",
                                    descripcion,
                                );
                                this.oModel.setProperty(sModel + "/id_unidad_medida", id);
                            }
                        },
                        fnSearchFilter: (sValue) => {
                            const aColumnsN = [["id"]];
                            const aColumnsS = [
                                ["unidad", 3],
                                ["descripcion", 50],
                            ];

                            const filters = this.filterHelper.generateFilter(sValue, {
                                aColumnsS,
                                aColumnsN,
                            });

                            return filters;
                        },
                        oLoadParams: {
                            name:
                                this.oModel.getProperty("/mConfigView/URLFragments") + sHelpDialog,
                            addToDependents: false,
                        },
                    });
                },

                onOpenProvidersList: async function (oEvent, sDialog, sHelpDialog, sModel) {
                    this.currentInputOpenList = oEvent.getSource();
                    this._oDialogHelper.fnOpenHelpDialog({
                        sDialog,
                        sHelpDialog,
                        /* fnInitFilter: () => {
                            const sBusinessValue = this.oModel.getProperty(
                                sModel + "/id_empresa_hana"
                            );

                            const oFilter = new Filter({
                                path: "cod_empresa",
                                operator: FilterOperator.EQ,
                                value1: sBusinessValue,
                            });

                            return [oFilter];
                        }, */
                        fnDataContext: (aDataContext) => {
                            for (const dataContext of aDataContext) {
                                const { id, nombre_proveedor, numero_cuenta } =
                                    dataContext.getObject();

                                const sModelTemp = sModel.includes("activo")
                                    ? "/" + sModel.split("/")[1]
                                    : "/" + sModel.split("/")[1];

                                this.oModel.setProperty(
                                    sModelTemp + "/excludes/nombre_proveedor",
                                    nombre_proveedor,
                                );
                                this.oModel.setProperty(sModel + "/id_proveedor", id);
                            }
                        },
                        fnSearchFilter: (sValue) => {
                            const aColumnsN = [["id"]];
                            const aColumnsS = [
                                ["nombre_proveedor", 100],
                                ["numero_cuenta", 255],
                            ];

                            const filters = this.filterHelper.generateFilter(sValue, {
                                aColumnsS,
                                aColumnsN,
                            });

                            return filters;
                        },
                        oLoadParams: {
                            name:
                                this.oModel.getProperty("/mConfigView/URLFragments") + sHelpDialog,
                            addToDependents: false,
                        },
                    });
                },

                onOpenCountriesList: async function (oEvent, sDialog, sHelpDialog, sModel) {
                    this.currentInputOpenList = oEvent.getSource();
                    this._oDialogHelper.fnOpenHelpDialog({
                        sDialog,
                        sHelpDialog,
                        /* fnInitFilter: () => {
                            const sBusinessValue = this.oModel.getProperty(
                                sModel + "/id_empresa_hana"
                            );

                            const oFilter = new Filter({
                                path: "cod_empresa",
                                operator: FilterOperator.EQ,
                                value1: sBusinessValue,
                            });

                            return [oFilter];
                        }, */
                        fnDataContext: (aDataContext) => {
                            for (const dataContext of aDataContext) {
                                const { id, nombre, codigo_iso } = dataContext.getObject();

                                const sModelTemp = sModel.includes("activo")
                                    ? "/" + sModel.split("/")[1]
                                    : "/" + sModel.split("/")[1];

                                this.oModel.setProperty(
                                    sModelTemp + "/excludes/nombre_pais",
                                    nombre,
                                );
                                this.oModel.setProperty(sModel + "/id_pais", id);
                            }
                        },
                        fnSearchFilter: (sValue) => {
                            const aColumnsN = [["id"]];
                            const aColumnsS = [
                                ["nombre", 100],
                                ["codigo_iso", 3],
                            ];

                            const filters = this.filterHelper.generateFilter(sValue, {
                                aColumnsS,
                                aColumnsN,
                            });

                            return filters;
                        },
                        oLoadParams: {
                            name:
                                this.oModel.getProperty("/mConfigView/URLFragments") + sHelpDialog,
                            addToDependents: false,
                        },
                    });
                },

                onOpenResponsiblesList: async function (oEvent, sDialog, sHelpDialog, sModel) {
                    this.currentInputOpenList = oEvent.getSource();
                    this.currentInputOpenList = oEvent.getSource();
                    this._oDialogHelper.fnOpenHelpDialog({
                        sDialog,
                        sHelpDialog,
                        /* fnInitFilter: () => {
                            const sBusinessValue = this.oModel.getProperty(
                                sModel + "/id_empresa_hana"
                            );

                            const oFilter = new Filter({
                                path: "cod_empresa",
                                operator: FilterOperator.EQ,
                                value1: sBusinessValue,
                            });

                            return [oFilter];
                        }, */
                        fnDataContext: (aDataContext) => {
                            for (const dataContext of aDataContext) {
                                const { id, cargo, nombre_responsable } = dataContext.getObject();

                                const sModelTemp = sModel.includes("activo")
                                    ? "/" + sModel.split("/")[1]
                                    : "/" + sModel.split("/")[1];

                                this.oModel.setProperty(
                                    sModelTemp + "/excludes/nombre_responsable_activo",
                                    nombre_responsable,
                                );
                                this.oModel.setProperty(sModel + "/id_responsable", id);
                            }
                        },
                        fnSearchFilter: (sValue) => {
                            const aColumnsN = [["id"]];
                            const aColumnsS = [
                                ["cargo", 50],
                                ["nombre_responsable", 100],
                            ];

                            const filters = this.filterHelper.generateFilter(sValue, {
                                aColumnsS,
                                aColumnsN,
                            });

                            return filters;
                        },
                        oLoadParams: {
                            name:
                                this.oModel.getProperty("/mConfigView/URLFragments") + sHelpDialog,
                            addToDependents: false,
                        },
                    });
                },

                onClearValues: function (oEvent, sModel) {
                    const sBindingModel = oEvent.getSource().getBinding("value").getPath();

                    const oControl = oEvent.getSource();
                    const sOldValue = oControl.mProperties.value;
                    const sNewValue = oControl.getValue();

                    if (sOldValue === "") {
                        this.oModel.setProperty(sModel, null);
                        this.oModel.setProperty(sBindingModel, null);
                        oControl.setValue(null);

                        return;
                    }

                    if (sOldValue !== sNewValue) {
                        oControl.setValue(sOldValue);
                    }
                },
            },
        );
    },
);
