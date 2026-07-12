# Fase 04: Patrones de Base de Datos

## Objetivo

Proteger la integridad de los datos agregando transacciones al indexador y haciendo los repositorios instanciables (no singletons de módulo).

## ¿Por qué es importante?

Si el indexador crashea a mitad de una operación (DELETE + INSERT), hoy pierdes datos o dejas chunks huérfanos. Con transacciones, se revierte todo.

## Ejercicios

1. **Transacciones en PostgresDocumentIndexer**: Envolver DELETE+INSERT en BEGIN/COMMIT/ROLLBACK
2. **Repositorio instanciable**: Refactorizar `PostgresDocumentRepository` para que acepte el pool por constructor (testeable)

## Tiempo: ~1 semana

Ver `ejercicios.md` para detalles y `guia.md` para conceptos.
