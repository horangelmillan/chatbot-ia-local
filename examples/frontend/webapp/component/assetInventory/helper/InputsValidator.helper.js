sap.ui.define(
    [
        "sap/ui/base/Object",
        "com/mundocloud/assetmanagement/component/masterData/helper/Util.helper",
    ],
    function (ObjectUI5, Util) {
        "use strict";

        return ObjectUI5.extend(
            "com.mundocloud.assetmanagement.component.masterData.helper.InputsValidator.helper",
            {
                // Get controller context
                constructor: function (oController) {
                    this._oController = oController;
                    this._oCustomValidators = {};
                },
                config: function (obj) {
                    this._oCustomValidators = this._combineObjects(this._oCustomValidators, obj);
                },

                apply: function (fn, aIds) {
                    const obj = {};

                    for (const id of aIds) {
                        obj[id] = obj[id] ? obj[id].concat(fn) : [fn];
                    }

                    this._oCustomValidators = this._combineObjects(this._oCustomValidators, obj);
                },

                _combineObjects: function (obj1, obj2) {
                    const result = {};

                    for (const key of Object.keys(obj1)) {
                        const value1 = obj1[key];
                        const value2 = obj2[key];

                        if (Array.isArray(value1) && Array.isArray(value2)) {
                            result[key] = [...value1, ...value2];
                        } else {
                            result[key] =
                                typeof value1 === "object" && typeof value2 === "object"
                                    ? this._combineObjects(value1, value2)
                                    : value1 !== undefined
                                      ? value1
                                      : value2;
                        }
                    }

                    for (const key of Object.keys(obj2)) {
                        if (!obj1[key]) {
                            result[key] = obj2[key];
                        }
                    }

                    return result;
                },

                // Retorna los "id" de los campos que tengan required en true
                _returnIdListOfRequiredFields: function () {
                    return new Promise((resolve, reject) => {
                        const arrRequiredInputs = [];
                        const arrElements = this._oController.getView().findElements(true);
                        for (let oElement of arrElements) {
                            if (!oElement.data().required || oElement.data().required === "false")
                                continue;
                            if (!oElement.getVisible || !oElement.getVisible()) continue;
                            arrRequiredInputs.push(oElement.getId().match(/--([^--]+)$/)[1]);
                        }
                        resolve(arrRequiredInputs);
                    });
                },

                // Set arr controls and execute callback function to their controls
                _iterateInputController: function (aInputsId, fncControlCb) {
                    return new Promise(async (resolve, reject) => {
                        for (var i = 0; i < aInputsId.length; i++) {
                            let oInput = this._oController.byId(aInputsId[i]);
                            let result = await fncControlCb(oInput);
                            if (result === false) resolve(result);
                        }

                        resolve(true);
                    });
                },

                cleanValuesState: async function () {
                    try {
                        let aInputsRequiredId = await this._returnIdListOfRequiredFields();
                        await this._iterateInputController(aInputsRequiredId, (oInput) => {
                            oInput.setValueState();
                        });
                    } catch (oError) {
                        Util.onShowMessage(oError.message, "toast", null, null);
                    }
                },

                _fnIsInputForm: function (oInput) {
                    const aFormNames = ["sap.ui.layout.form.Form"];
                    const aDialogNames = ["sap.m.Dialog"];

                    // Función recursiva para buscar el contenedor padre del Input
                    function findParentControl(oControl, aTargetNames) {
                        if (!oControl) {
                            return null;
                        }
                        const sControlName = oControl.getMetadata().getName();
                        if (aTargetNames.includes(sControlName)) {
                            return oControl;
                        }
                        return findParentControl(oControl.getParent(), aTargetNames);
                    }

                    const aOpenDialogs = sap.m.InstanceManager.getOpenDialogs();
                    const aDialogIds = aOpenDialogs.map((oOpenDialog) => oOpenDialog.getId());

                    // Verificar si el Input pertenece a un diálogo abierto
                    const oDialog = findParentControl(oInput, aDialogNames);
                    if (oDialog) {
                        if (aDialogIds.includes(oDialog.getId())) {
                            console.log(
                                "El Input pertenece al diálogo abierto con ID:",
                                oDialog.getId(),
                            );
                            return true; // Cambié esto porque solo queremos validar diálogos abiertos
                        }
                    }

                    // Si no pertenece a un diálogo abierto, verificar si pertenece a un formulario
                    const oForm = findParentControl(oInput, aFormNames);
                    if (oForm && !aDialogIds.length) {
                        console.log("El Input pertenece al formulario con ID:", oForm.getId());
                        return true; // Si pertenece a un formulario, retorna true
                    }

                    console.log(
                        "El Input no pertenece ni a un diálogo abierto ni a un formulario.",
                    );
                    return false;
                },

                _validationProcess: async function (oInput, sBlockProcess) {
                    try {
                        let bIsInputForm = this._fnIsInputForm(oInput);

                        if (!bIsInputForm) {
                            return;
                        }

                        let oValidationResult = await this._validateInput(oInput, sBlockProcess);

                        if (!oValidationResult.bValid) {
                            oInput.setValueState(sap.ui.core.ValueState.Error);

                            if (oInput.setShowValueStateMessage) {
                                oInput.setShowValueStateMessage(false);
                            } else if (oInput.setValueStateText) {
                                oInput.setValueStateText(String.fromCharCode(160));
                            }

                            return Promise.resolve(false);
                        } else {
                            oInput.setValueState();
                        }
                    } catch (oError) {
                        Util.onShowMessage(oError.message, "toast", null, null);
                    }
                },

                validateField: async function (oInput) {
                    if (typeof oInput !== "object") oInput = this._oController.byId(oInput);
                    await this._validationProcess(oInput, null);
                },

                validateFields: async function (sBlockProcess) {
                    try {
                        let aRequiredFields = await this._returnIdListOfRequiredFields();

                        let bAllValid = await this._iterateInputController(
                            aRequiredFields,
                            async (oInput) => {
                                return await this._validationProcess(oInput, sBlockProcess);
                            },
                        );

                        return Promise.resolve(bAllValid);
                    } catch (oError) {
                        Util.onShowMessage(oError.message, "error", null, null);
                    }
                },

                _validateInput: function (oInput, sBlockProcess) {
                    let sType = oInput.getMetadata().getElementName();
                    switch (sType) {
                        case "sap.m.MultiComboBox":
                            return this._validateMultiComboBox(oInput);
                        case "sap.m.MultiInput":
                            return this._validateMultiInput(oInput);
                        case "sap.m.Select":
                            return this._validateSelect(oInput);
                        case "sap.m.Input":
                            return this._validateInputField(oInput, sBlockProcess);
                        case "sap.m.RadioButtonGroup":
                            return this._validateRadioButtonGroup(oInput);
                        default:
                            return this._validateInputField(oInput, null);
                    }
                },

                _validateMultiComboBox: async function (oMultiComboBox) {
                    let bValid1 = await this._execCustomValidators(oMultiComboBox, null);

                    if (!bValid1) return { bValid: false, oInput: oMultiComboBox };

                    let bValid2 = oMultiComboBox.getSelectedKeys().length > 0;

                    if (oMultiComboBox.getRequired && !oMultiComboBox.getRequired()) {
                        bValid2 = true;
                    }

                    return { bValid: bValid2 && bValid1, oInput: oMultiComboBox };
                },

                _validateMultiInput: async function (oMultiInput) {
                    let bValid1 = await this._execCustomValidators(oMultiInput, null);

                    if (!bValid1) return { bValid: false, oInput: oMultiInput };

                    let bValid2 = oMultiInput.getTokens().length > 0;

                    if (oMultiInput.getRequired && !oMultiInput.getRequired()) {
                        bValid2 = true;
                    }

                    return { bValid: bValid2 && bValid1, oInput: oMultiInput };
                },

                _validateSelect: async function (oSelect) {
                    let bValid1 = await this._execCustomValidators(oSelect, null);

                    if (!bValid1) return { bValid: false, oInput: oSelect };

                    let bValid2 = oSelect.getSelectedKey() !== "";

                    if (oSelect.getRequired && !oSelect.getRequired()) {
                        bValid2 = true;
                    }

                    return { bValid: bValid2 && bValid1, oInput: oSelect };
                },

                _validateInputField: async function (oInputField, sBlockProcess) {
                    let bValid1 = await this._execCustomValidators(oInputField, sBlockProcess);

                    if (!bValid1) return { bValid: false, oInput: oInputField };

                    let bValid2 = oInputField.getValue().length > 0;

                    if (oInputField.getRequired && !oInputField.getRequired()) {
                        bValid2 = true;
                    }

                    return { bValid: bValid1 && bValid2, oInput: oInputField };
                },

                _validateRadioButtonGroup: async function (oRadioButtonGroup) {
                    let bValid1 = await this._execCustomValidators(oRadioButtonGroup, null);

                    if (!bValid1) return { bValid: false, oInput: oRadioButtonGroup };

                    let bValid2 = oRadioButtonGroup.getSelectedIndex() !== -1;

                    if (oRadioButtonGroup.getRequired && !oRadioButtonGroup.getRequired()) {
                        bValid2 = true;
                    }

                    return { bValid: bValid1 && bValid2, oInput: oRadioButtonGroup };
                },

                _execCustomValidators: function (oInput, sBlockProcess) {
                    return new Promise((resolve, reject) => {
                        if (!this._oCustomValidators) {
                            resolve(true);
                        }

                        let oInputsValidators = this._oCustomValidators;

                        let promises = [];

                        for (const data in oInputsValidators) {
                            if (data === oInput.getId().split("--")[1]) {
                                oInputsValidators[data].forEach(async (fn) => {
                                    if (
                                        fn.name === "_generateDivision" &&
                                        sBlockProcess === "true"
                                    ) {
                                        console.log("se omite proceso custom");
                                    } else {
                                        promises.push(fn(oInput, this._oController));
                                    }
                                });
                            }
                        }

                        Promise.all(promises).then((results) => {
                            let isValid = results.some((result) => !result);
                            resolve(!isValid);
                        });
                    });
                },
            },
        );
    },
);
