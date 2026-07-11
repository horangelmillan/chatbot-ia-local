sap.ui.define(
    ["sap/ui/base/Object", "sap/ui/model/Filter", "sap/ui/model/FilterOperator"],
    function (ObjectUI5, Filter, FilterOperator) {
        "use strict";

        const FilterHelper = ObjectUI5.extend(
            "com.mundocloud.assetmanagement.component.masterData.helper.Filter.helper",
            {
                generateFilter: function (
                    sValue,
                    oColumns = { aColumnsS: [], aColumnsN: [], aColumnsD: [] },
                ) {
                    const aFilters = [];

                    if (this._isDecimal(sValue) && oColumns.aColumnsN) {
                        const oParams = this._isDecimal(sValue)
                            ? FilterOperator.EQ
                            : FilterOperator.Contains;

                        oColumns.aColumnsN.forEach((sColumn) => {
                            const sColumnValue = Array.isArray(sColumn) ? sColumn[0] : sColumn;

                            if (Array.isArray(sColumn) && sValue.toString().length > sColumn[1]) {
                                return;
                            }

                            aFilters.push(new Filter(sColumnValue, oParams, Number(sValue)));
                        });
                    } else if (this._isDate(sValue) && oColumns.aColumnsD) {
                        const { dDateStart, dDateEnd } = this._generateDateFilter(new Date(sValue));

                        let dValue1 = JSON.stringify(dDateStart).slice(1, -1);
                        let dValue2 = JSON.stringify(dDateEnd).slice(1, -1);

                        oColumns.aColumnsD.forEach((sColumn) => {
                            const oFilter = new Filter({
                                path: sColumn,
                                operator: FilterOperator.BT,
                                value1: dValue1,
                                value2: dValue2,
                            });

                            aFilters.push(oFilter);
                        });
                    } else if (sValue && oColumns.aColumnsS) {
                        oColumns.aColumnsS.forEach((sColumn) => {
                            const sColumnValue = Array.isArray(sColumn) ? sColumn[0] : sColumn;

                            if (Array.isArray(sColumn) && sValue.length > sColumn[1]) {
                                return;
                            }

                            const oFilter = new Filter({
                                path: sColumnValue,
                                operator: FilterOperator.Contains,
                                value1: sValue,
                            });

                            aFilters.push(oFilter);
                        });
                    } else {
                        return [];
                    }

                    return new Filter({
                        filters: aFilters,
                        and: false,
                    });
                },

                _isDecimal: function (value) {
                    return !isNaN(parseFloat(value)) && value.toString().indexOf(".") !== -1;
                },

                _isNumber: function (cadena) {
                    return /^\d+$/.test(cadena);
                },

                _isDate: function (sValue) {
                    const bIsDate = /^\d{4}-\d{2}-\d{2}$/.exec(sValue);

                    if (!bIsDate) return bIsDate;

                    const date = new Date(sValue);
                    return date instanceof Date && !isNaN(date);
                },

                _generateDateFilter: function (dDate) {
                    var dDateStart = dDate;
                    var dDateEnd = new Date(dDateStart);

                    dDateStart.setMilliseconds(0);
                    dDateStart.setSeconds(0);
                    dDateStart.setMinutes(0);
                    dDateStart.setHours(0);

                    // Set second date as end of day
                    dDateEnd.setMilliseconds(0);
                    dDateEnd.setSeconds(59);
                    dDateEnd.setMinutes(59);
                    dDateEnd.setHours(23);

                    return {
                        dDateStart,
                        dDateEnd,
                    };
                },
            },
        );

        return FilterHelper;
    },
);
