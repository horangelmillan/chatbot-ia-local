sap.ui.define(
    [
        "sap/ui/base/ManagedObject",
        "sap/ui/core/dnd/DragInfo",
        "sap/f/dnd/GridDropInfo",
        "sap/ui/core/library",
    ],
    function (ManagedObject, DragInfo, GridDropInfo, coreLibrary) {
        "use strict";

        // shortcut for sap.ui.core.dnd.DropLayout
        const DropLayout = coreLibrary.dnd.DropLayout;

        // shortcut for sap.ui.core.dnd.DropPosition
        const DropPosition = coreLibrary.dnd.DropPosition;

        return ManagedObject.extend(
            "com.mundocloud.assetmanagement.component.portal.helper.DropGrid.helper",
            {
                constructor: function (oController) {
                    this._oController = oController;
                },

                init: function () {
                    const oCardManifests = this._oController
                        .getOwnerComponent()
                        .getModel("ModelCardManifest");
                    const oGrid = this._oController.byId("grid1");

                    this._oController.getView().setModel(oCardManifests, "manifests");

                    oGrid.addDragDropConfig(
                        new DragInfo({
                            sourceAggregation: "items",
                        }),
                    );

                    oGrid.addDragDropConfig(
                        new GridDropInfo({
                            targetAggregation: "items",
                            dropPosition: DropPosition.Between,
                            dropLayout: DropLayout.Horizontal,
                            drop: function (oInfo) {
                                var oDragged = oInfo.getParameter("draggedControl"),
                                    oDropped = oInfo.getParameter("droppedControl"),
                                    sInsertPosition = oInfo.getParameter("dropPosition"),
                                    iDragPosition = oGrid.indexOfItem(oDragged),
                                    iDropPosition = oGrid.indexOfItem(oDropped);

                                oGrid.removeItem(oDragged);

                                if (iDragPosition < iDropPosition) {
                                    iDropPosition--;
                                }

                                if (sInsertPosition === "After") {
                                    iDropPosition++;
                                }

                                oGrid.insertItem(oDragged, iDropPosition);
                                oGrid.focusItem(iDropPosition);
                            },
                        }),
                    );

                    // Use smaller margin around grid when on smaller screens
                    oGrid.attachLayoutChange(function (oEvent) {
                        var sLayout = oEvent.getParameter("layout");

                        if (sLayout === "layoutXS" || sLayout === "layoutS") {
                            oGrid.removeStyleClass("sapUiSmallMargin");
                            oGrid.addStyleClass("sapUiTinyMargin");
                        } else {
                            oGrid.removeStyleClass("sapUiTinyMargin");
                            oGrid.addStyleClass("sapUiSmallMargin");
                        }
                    });
                },
            },
        );
    },
);
