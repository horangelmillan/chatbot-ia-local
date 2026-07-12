/**
 * ChatContextPort
 *
 * Puerto de salida para el contexto de conversación.
 * Permite recordar la última consulta realizada para soportar
 * intenciones de tipo "continuation".
 *
 * @typedef {Object} ChatContextPort
 * @property {() => Object|null} get
 *   Retorna el contexto guardado o null si no hay.
 * @property {(context:Object) => void} set
 *   Guarda el contexto de la consulta actual.
 * @property {() => void} reset
 *   Limpia el contexto.
 */

module.exports = {};
