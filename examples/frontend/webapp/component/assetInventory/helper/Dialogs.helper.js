sap.ui.define(
    [
        "sap/ui/base/Object",
        "com/mundocloud/assetmanagement/component/assetInventory/helper/Util.helper",
        "sap/ui/model/Filter",
    ],
    function (ObjectUI5, Util, Filter) {
        "use strict";

        return ObjectUI5.extend(
            "com.mundocloud.assetmanagement.component.assetInventory.helper.Dialogs.helper",
            {
                constructor: function (oController) {
                    this.oController = oController;
                },

                fnDestroyFragment: function (sGlobalVariable, sPathModel) {
                    try {
                        this.oController.oModel.setProperty(sPathModel, {});
                        // await this._oValidator.cleanValuesState();
                        this.oController[sGlobalVariable].destroy();
                        this.oController[sGlobalVariable] = undefined;
                    } catch (error) {
                        console.log("Ocurrió un error al destruir el fragmento: ", error);
                        Util.onShowMessage(error.message, "error", null, null);
                    }
                },
                fnOpenDialog: async function (sGlobalVariable, sUrlFragment) {
                    if (!this.oController[sGlobalVariable]) {
                        this.oController[sGlobalVariable] = await this.oController.loadFragment({
                            name: sUrlFragment,
                        });
                    }
                    this.oController[sGlobalVariable].open();
                },

                fnOnOpenDialog: async function (sIdFragment, tempURL) {
                    try {
                        const sIdDinamicFragment = !tempURL
                            ? sIdFragment
                            : sIdFragment.split(".").pop();
                        console.log(sIdDinamicFragment);
                        if (!this.oController[sIdDinamicFragment]) {
                            this.oController[sIdDinamicFragment] =
                                await this.oController.loadFragment({
                                    name: tempURL
                                        ? sIdFragment
                                        : this.oController.URLFragment +
                                          sIdDinamicFragment.replace("Fragment", ""),
                                });
                        }
                        this.oController[sIdDinamicFragment].open();
                    } catch (error) {
                        console.log("Ocurrió un error al abrir el fragmento: " + error);
                    }
                },

                fnOpenHelpDialog: async function ({
                    sDialog,
                    sHelpDialog,
                    fnInitFilter = () => {
                        return [];
                    },
                    fnSearchFilter = () => {
                        return [];
                    },
                    // Manejador de datos
                    fnDataContext = () => {},
                    oLoadParams = null,
                }) {
                    try {
                        let that = this.oController;
                        // se define el dialogo de forma dinamica en el contexto global

                        const oLoadFragmentParams = oLoadParams
                            ? oLoadParams
                            : {
                                  name:
                                      this.oController.URLFragment +
                                      sHelpDialog.replace("Fragment", ""),
                                  addToDependents: false,
                              };

                        if (!this.oController[sHelpDialog]) {
                            this.oController[sHelpDialog] =
                                await this.oController.loadFragment(oLoadFragmentParams);
                        }

                        // se vincula el dialogo al que lo está llamando para que se superposicione
                        console.log(sDialog);
                        this.oController.getView().addDependent(this.oController[sHelpDialog]);

                        // se captura el evento y se amneja información relacionada
                        this.oController[sHelpDialog].attachConfirm(function (oEvent) {
                            let oDialog = oEvent.getSource();

                            // existen casos en los que se puede traer varias filas o registros como un multi select
                            let aDataContexts = oEvent.getParameter("selectedContexts");
                            fnDataContext(aDataContexts);
                            oDialog.destroy();
                            that[sHelpDialog] = undefined;
                        });

                        // se captura el evento al cerrar el dialogo
                        this.oController[sHelpDialog].attachCancel(function (oEvent) {
                            let oDialog = oEvent.getSource();
                            oDialog.destroy();
                            that[sHelpDialog] = undefined;
                        });

                        // se maneja el evento al realizar una busqueda
                        this.oController[sHelpDialog].attachSearch(function (oEvent) {
                            const sValue = oEvent.getParameter("value");

                            const aSearchFilters = fnSearchFilter(sValue);
                            const aInitFilters = fnInitFilter();

                            const aFiltersMerged = [aSearchFilters, ...aInitFilters].filter(
                                (filter) =>
                                    filter !== (null | undefined) &&
                                    (Array.isArray(filter) ? filter[0] !== undefined : true),
                            );

                            oEvent
                                .getSource()
                                .getBinding("items")
                                .filter(
                                    aFiltersMerged[0]
                                        ? new Filter({
                                              filters: aFiltersMerged,
                                              and: true,
                                          })
                                        : aFiltersMerged,
                                );
                        });

                        // se filtra tabla por defecto al abrirla
                        const oInitFilter = new Filter({
                            filters: fnInitFilter(),
                            and: true,
                        });

                        this.oController[sHelpDialog].getBinding("items").filter(oInitFilter);
                        this.oController[sHelpDialog].open();
                    } catch (error) {
                        console.log("Ocurrió un error al abrir el dialogo de sugerencia: ", error);
                    }
                },
            },
        );
    },
);
