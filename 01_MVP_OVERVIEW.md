# MVP - SAPUI5 AI Chat

## Objetivo

Construir un MVP funcional en 90 minutos que demuestre un asistente
conversacional integrado en SAPUI5 usando IA local.

## Arquitectura

SAPUI5 Chat -\> Node.js (Express) -\> LM Studio (OpenAI Compatible API)
-\> Northwind OData

## Alcance

-   Chat con interfaz sencilla.
-   Una caja de texto.
-   Historial de mensajes.
-   Backend en Express.
-   LM Studio local.
-   Consulta OData únicamente cuando la IA detecte una consulta de
    negocio.

## Casos soportados

-   Consultar órdenes.
-   Consultar clientes.
-   Consultar facturas (simuladas usando Orders).
-   Rechazar preguntas fuera del dominio.

No invertir tiempo en autenticación, estilos complejos o persistencia.
