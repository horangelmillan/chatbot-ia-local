sap.ui.define([], function () {
	"use strict";
	// ponytail: opciones estaticas de bienvenida.
	// Agregar una opcion: { label: "...", message: "..." }
	// Si crecen a >6 opciones, migrar a Select/SelectDialog con grouping.
	return [
		{ label: "Ultimos pedidos", message: "Muestrame los ultimos 5 pedidos" },
		{ label: "Buscar cliente", message: "Busca el cliente ALFKI" },
		{ label: "Consultar factura", message: "Dame la factura de la orden 10248" },
		{ label: "Que puedes hacer?", message: "Que puedes hacer?" }
	];
});
