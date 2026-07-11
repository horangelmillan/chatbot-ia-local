sap.ui.define(
    [
        "com/mundocloud/assetmanagement/component/masterData/helper/Util.helper",
        "sap/ui/model/json/JSONModel",
    ],
    function (Util, JSONModel) {
        "use strict";

        return {
            /*         fnOnGetUserInfo: function () {
            let modelUser = new JSONModel();
            modelUser.loadData("/user/attributes", "", false);
            const { email } = modelUser.getData();
            return email;
        }, */
            _mainURL: "URL_SERVER",
            patch: async function (json, route) {
                let result;
                try {
                    result = await $.ajax({
                        type: "PATCH",
                        url: `${this._mainURL}api${route}`,
                        data: JSON.stringify(json),
                        contentType: "application/json",
                    });
                    return Promise.resolve(result);
                } catch (response) {
                    Util.onShowMessage(
                        "Error en la petición: " + response.responseJSON.message,
                        "error",
                        null,
                        null,
                    );
                    return Promise.reject(response);
                }
            },

            post: async function (json, route) {
                let result;
                try {
                    result = await $.ajax({
                        type: "POST",
                        url: `${this._mainURL}api${route}`,
                        data: JSON.stringify(json),
                        contentType: "application/json",
                    });
                    return result;
                } catch (oError) {
                    throw oError;
                }
            },

            get: async function (route) {
                let result;
                try {
                    result = await $.ajax({
                        type: "GET",
                        url: `${this._mainURL}api${route}/`,
                    });
                    return Promise.resolve(result);
                } catch (error) {
                    Util.onShowMessage(
                        `Estamos presentando problemas, por favor inténtelo más tarde.`,
                        "error",
                        null,
                        null,
                    );
                    return Promise.reject(error);
                }
            },

            getById: async function (route, id) {
                let result;
                try {
                    result = await $.ajax({
                        type: "GET",
                        url: `${this._mainURL}api${route}/${id}`,
                    });
                    return result;
                } catch (oError) {
                    throw oError;
                }
            },
            put: async function (id, route, json) {
                let result;
                try {
                    result = await $.ajax({
                        type: "PUT",
                        url: `${this._mainURL}api${route}/${id}`,
                        data: JSON.stringify(json),
                        contentType: "application/json",
                    });
                    return Promise.resolve(result);
                } catch (oError) {
                    throw oError;
                }
            },

            onConectionRNDC: async function (xml) {
                const dataRespuesta = {
                    tag: "",
                    text: "",
                };

                let result;

                try {
                    result = await $.ajax({
                        url: "/RNDC/soap/IBPMServices",
                        data: xml,
                        type: "POST",
                        dataType: "xml",
                        async: false,
                        contentType: 'text/xml; charset="utf-8"',
                    });

                    const respuesta = result.getElementsByTagName("return")[0].textContent;
                    const parse = new DOMParser();
                    const xmlDoc = parse.parseFromString(respuesta, "text/xml");
                    dataRespuesta.tag =
                        xmlDoc.getElementsByTagName("root")[0].childNodes[1].nodeName;
                    dataRespuesta.text =
                        xmlDoc.getElementsByTagName("root")[0].childNodes[1].innerHTML;

                    return Promise.resolve(dataRespuesta);
                } catch (response) {
                    Util.onShowMessage("Error en la petición al RNDC", "error", null, null);
                    return Promise.reject(response);
                }
            },

            getTEST: async function (url, route) {
                let result;
                try {
                    result = await $.ajax({
                        type: "GET",
                        url: `${this._mainURL}api${url}`,
                        headers: {
                            queryParams: route,
                        },
                    });
                    return Promise.resolve(result);
                } catch (error) {
                    Util.onShowMessage(
                        `Estamos presentando problemas, por favor inténtelo más tarde.`,
                        "error",
                        null,
                        null,
                    );
                    return Promise.reject(error);
                }
            },
        };
    },
);
