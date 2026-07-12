/**
 * DocumentRepositoryPort
 *
 * Puerto de salida para la recuperación de documentos y FAQs.
 * La capa de aplicación depende de esta interfaz; los adaptadores
 * de infraestructura (PostgreSQL, pgvector, etc.) la implementan.
 *
 * @typedef {Object} DocumentRepositoryPort
 * @property {(category: string|null, keywords: string[]) => Promise<{type:string, data:Object}|null>} search
 *   Busca en cascada: FAQ primero, luego chunks vía FTS. Retorna null si no hay resultados.
 * @property {(category: string|null, keywords: string[]) => Promise<Object|null>} searchFAQ
 *   Busca solo en la tabla FAQ por coincidencia de keywords array.
 * @property {(category: string|null, keywords: string[]) => Promise<Object|null>} searchChunks
 *   Busca solo en document_chunks vía Full Text Search en español.
 */

module.exports = {}; // Puerto como convención documentada via JSDoc
