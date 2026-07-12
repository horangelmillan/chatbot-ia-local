/**
 * LLMPort
 *
 * Puerto de salida para inferencia con modelos de lenguaje (LLM).
 * La capa de aplicación depende de esta interfaz para clasificar
 * intenciones y generar respuestas, sin conocer el proveedor (LM Studio,
 * OpenAI API, Ollama, etc.).
 *
 * @typedef {Object} LLMPort
 * @property {(messages: Array<{role:string, content:string}>, temperature?: number) => Promise<string>} chatCompletion
 *   Envía un array de mensajes (system + user + assistant) al LLM y
 *   devuelve el contenido del mensaje de respuesta.
 */

module.exports = {};
