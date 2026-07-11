sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "com/mundocloud/assetmanagement/component/masterData/helper/Util.helper",
        "com/mundocloud/assetmanagement/component/masterData/helper/Dialogs.helper",
        "com/mundocloud/assetmanagement/component/masterData/helper/ExportExcel",
        "com/mundocloud/assetmanagement/component/masterData/helper/InputsValidator.helper",
        "com/mundocloud/assetmanagement/component/masterData/helper/RequestMethods.helper",
        "com/mundocloud/assetmanagement/component/masterData/helper/Filter.helper",
        "com/mundocloud/assetmanagement/component/masterData/lib/SheetJS",
        "sap/m/Token",
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
    ) {
        "use strict";

        return Controller.extend("com.mundocloud.assetmanagement.component.masterData.base.Base", {
            filterHelper: new Filter(),

            async onAfterRendering(oEvent) {
                try {
                    Util.loader(true);

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
                } catch (error) {
                    console.log(error);
                } finally {
                    Util.loader(false);
                }
            },

            fnAddValidatorMI: function () {
                const oMultiInputCreate = this.byId("multiInputCriteriaCreate");
                const oMultiInputEdit = this.byId("multiInputCriteriaEdit");

                // add validator
                const fnValidator = function (args) {
                    console.log(args);

                    const text = args.text;
                    return new Token({ key: text, text: text });
                };

                for (const oInput of [oMultiInputCreate, oMultiInputEdit]) {
                    if (oInput) oInput.addValidator(fnValidator);
                }
            },

            onOpenDialogCreate: function () {
                const { URIFragmentFolder } = this.oModel.getProperty("/mConfigView");
                this._oDialogHelper.fnOpenDialog(
                    "oDialogCreate",
                    `com.mundocloud.assetmanagement.component.masterData.view.fragments.${URIFragmentFolder}.formCreate`,
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
                        `com.mundocloud.assetmanagement.component.masterData.view.fragments.${URIFragmentFolder}.formEdit`,
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
                this.oModel.setProperty("/mFormEdit/criterios", {});
                this.oModel.setProperty("/mCriteria", []);
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
                    const { idTable, idFragment, URLService } =
                        this.oModel.getProperty("/mConfigView");

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
                    Util.onShowMessage(oResponse.message, "done", null, null);
                    this.onCloseDialog(idFragment);
                    this.byId(idTable).getBinding("rows").refresh();
                } catch (oError) {
                    console.log(oError);
                    let oMessage = oError.responseText;
                    let oClassError = oError.statusText;

                    try {
                        const oErrorMessage = JSON.parse(oError.responseText);
                        oMessage = oErrorMessage?.message;
                        oClassError = oErrorMessage?.classError;
                    } catch {}

                    Util.onShowMessage(
                        `Ocurrio un error al guardar: ${oMessage}, ${oClassError}`,
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

            onEdit: async function () {
                try {
                    Util.loader(true);
                    const isValidFields = await this._oValidator.validateFields(null);
                    const { idTable, idFragment, URLService } =
                        this.oModel.getProperty("/mConfigView");

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
                    this.onCloseDialog(idFragment + "Edit");
                    this.byId(idTable).getBinding("rows").refresh();
                } catch (oError) {
                    console.log(oError);
                    let oMessage = oError.responseText;
                    let oClassError = oError.statusText;

                    try {
                        const oErrorMessage = JSON.parse(oError.responseText);
                        oMessage = oErrorMessage?.message;
                        oClassError = oErrorMessage?.classError;
                    } catch {}

                    Util.onShowMessage(
                        `Ocurrio un error al editar: ${oMessage}, ${oClassError}`,
                        "error",
                        null,
                        null,
                    );
                } finally {
                    Util.loader(false);
                }
            },

            removeMatchingProperties: function (target) {
                const oExcludesProperties = this.oModel.getProperty("/mExcludesProperties");

                if (!oExcludesProperties) return target;

                const removePropertiesRecursive = (obj) => {
                    // Recorremos las propiedades del objeto a excluir
                    for (const key of Object.keys(oExcludesProperties)) {
                        // Si existe en el objeto actual, la eliminamos
                        if (key in obj) {
                            delete obj[key];
                        }
                    }

                    // Recorremos las propiedades del objeto para buscar objetos anidados
                    for (const key in obj) {
                        if (typeof obj[key] === "object" && obj[key] !== null) {
                            // Llamada recursiva para objetos anidados
                            removePropertiesRecursive(obj[key]);
                        }
                    }
                };

                // Llamamos la función recursiva con el objeto target
                removePropertiesRecursive(target);

                return target;
            },

            onValidateField: async function (oEvent) {
                let oInput = oEvent.getSource();
                if (typeof oEvent.getSource().getValue() === "string") {
                    oEvent.getSource().setValue(oEvent.getSource().getValue().trim());
                }
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
            onRefresh: function (oEvent) {
                const { idTable } = this.oModel.getProperty("/mConfigView");

                const oTable = this.byId(idTable);
                oTable.getBinding("rows").refresh();
            },

            onUpdateMultiInput: function (oEvent, oAddCriteria) {
                const sIdMultiInput = oEvent.getSource().getId();
                const sIsModel = sIdMultiInput.includes("Create") ? "/mFormCreate" : "/mFormEdit";
                const sModelCriteriaDB = sIsModel + "/criterios";
                const sModelCriteria = "/mCriteria";
                let aCriteria = this.oModel.getProperty(sModelCriteria);

                if (!aCriteria) {
                    this.oModel.setProperty(sModelCriteria, []);

                    aCriteria = this.oModel.getProperty(sModelCriteria);
                }

                const sType = oEvent.getParameter("type"),
                    aAddedTokens = oEvent.getParameter("addedTokens"),
                    aRemovedTokens = oEvent.getParameter("removedTokens");

                let count = 0;

                switch (sType) {
                    // add new context to the data of the model, when new token is being added
                    case "added":
                        aAddedTokens.forEach(function (oToken) {
                            aCriteria.push({ key: oToken.getKey(), text: oToken.getText() });
                        });

                        count = aCriteria.length;
                        aCriteria = aCriteria.map((oToken) => {
                            if (count) {
                                if (oToken.key === "") {
                                    count--;
                                    return null;
                                }
                                return oToken;
                            }
                        });
                        aCriteria = aCriteria.filter((oToken) => oToken);
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

                if (aCriteria.length > 4) {
                    count = aCriteria.length - 4;
                    aCriteria = aCriteria.map((oToken) => {
                        if (count) {
                            if (oToken.key === "") {
                                count--;
                                return null;
                            }
                            return oToken;
                        }
                        return oToken;
                    });
                }

                aCriteria = aCriteria.filter((oToken) => oToken);

                if (aCriteria.length < 4) {
                    while (aCriteria.length < 4) {
                        aCriteria.push({ key: "", text: "" });
                    }
                }

                let oOldCriteria = this.oModel.getProperty(sModelCriteriaDB);

                if (!oOldCriteria) {
                    oOldCriteria = {};
                }

                for (const [index, oToken] of aCriteria.entries()) {
                    const key = `criterio_${index + 1}`;
                    // Inicializamos el valor de la propiedad en caso de que no exista previamente
                    if (!oOldCriteria[key]) {
                        oOldCriteria[key] = oToken.key || ""; // Si oToken.key existe, lo asigna; si no, asigna null
                    } else {
                        oOldCriteria[key] = oToken.key || "";
                    }
                }

                this.oModel.setProperty(sModelCriteriaDB, oOldCriteria);
                this.oModel.setProperty(sModelCriteria, aCriteria);
            },

            onFormatToToken: function (oEvent) {
                console.log(oEvent);
            },

            onOpenCriteriaList: async function (oEvent, sDialog, sHelpDialog, sModel) {
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

                            const aTokens = oEvent.getSource().getTokens();

                            const isDuplicate = aTokens.find(
                                (oToken) => oToken.mProperties?.key == criterio,
                            );

                            if (!isDuplicate) {
                                oEvent.getSource().addToken(
                                    new sap.m.Token({
                                        key: criterio,
                                        text: criterio,
                                    }),
                                );

                                this.onUpdateMultiInput(oEvent, { key: criterio, text: criterio });
                            }
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
                        name: this.oModel.getProperty("/mConfigView/URLFragments") + sHelpDialog,
                        addToDependents: false,
                    },
                });
            },
            onOpenResponsiblesList: async function (sDialog, sHelpDialog, sModel) {
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

                            this.oModel.setProperty("/mResponsibles/", {
                                id,
                                cargo,
                                nombre_responsable,
                            });

                            if (sModel.includes("Edit")) {
                                this.oModel.setProperty(
                                    sModel + "/nombre_responsable",
                                    nombre_responsable,
                                );
                            }

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
                        name: this.oModel.getProperty("/mConfigView/URLFragments") + sHelpDialog,
                        addToDependents: false,
                    },
                });
            },

            onValidateFieldFromFragment: async function (sIdInput) {
                await this._oValidator.validateField(sIdInput);
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
        });
    },
);
