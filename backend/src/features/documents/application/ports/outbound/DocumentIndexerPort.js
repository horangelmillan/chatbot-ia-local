/**
 * DocumentIndexerPort
 *
 * Puerto de salida para la indexación de documentos.
 * La capa de aplicación depende de esta interfaz para persistir
 * documentos procesados (parseados, chunked) en el sistema de almacenamiento.
 *
 * @typedef {Object} DocumentIndexerPort
 * @property {(filePath: string) => Promise<{code:string, chunks:number, id:number}>} indexDocument
 *   Parsea, chunkea y persiste un archivo individual. Retorna metadata del documento indexado.
 * @property {(dirPath: string) => Promise<Array<{code:string, chunks:number, id:number}>>} indexDirectory
 *   Indexa todos los archivos soportados en un directorio (recursivo).
 */

module.exports = {};
