/**
 * ODataPort
 *
 * Puerto de salida para consultas a APIs OData (datos de negocio).
 * Actualmente implementado por Northwind OData; preparado para
 * sustituir por SAP S/4HANA Cloud en producción.
 *
 * @typedef {Object} ODataPort
 * @property {(entity:string, filters?:Array<{field:string,op:string,value:string}>, expand?:string[], top?:number) => Promise<Object[]>} query
 *   Ejecuta una consulta OData y retorna el array de resultados.
 * @property {(customerId:string, excludeOrderId:number|string) => Promise<Object[]>} findSimilarOrders
 *   Busca órdenes recientes del mismo cliente (para enriquecer contexto).
 */

module.exports = {};
