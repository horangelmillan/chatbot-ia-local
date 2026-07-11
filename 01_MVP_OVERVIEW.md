# MVP - SAPUI5 AI Chat

## Objetivo

Construir un asistente conversacional integrado en SAPUI5 usando IA
local, que permite consultar datos de negocio (OData) y documentación
corporativa (FAQ, manuales, glosario) a través de un motor RAG.

## Arquitectura

```
SAPUI5 Chat → Node.js (Express) → LM Studio (Qwen3 8B)
                → Northwind OData (datos)
                → PostgreSQL 18 (documentos)
```

## Componentes

### Frontend (SAPUI5 / OpenUI5 1.150.0)
- Chat con burbujas de usuario/asistente.
- Botones dinámicos generados por la IA.
- Renderizado diferenciado para fragmentos documentales (borde naranja).
- Historial de últimos 20 mensajes.

### Backend (Node.js + Express, puerto 3001)
- `POST /api/chat` — clasifica intención y responde.
- `POST /api/documents/index` — indexa documentos.
- `GET /api/documents/search` — busca fragmentos documentales.
- `GET /api/documents/:id` — obtiene documento completo.
- Caché en memoria (`lastContext`).

### LLM Local (LM Studio + Qwen3 8B, puerto 1234)
- `decideAction` (temp 0.1): clasifica consultas: query, document_query, reply, unknown.
- `generateReply` (temp 0.8): genera respuesta natural solo con datos proporcionados.

### Motor Documental (RAG)
- **PostgreSQL 18** — base de datos `chatbot_rag`.
- **Document Engine** — busca FAQ → Glosario → Chunks (FTS español).
- **Indexador** — parsea Markdown/JSON/TXT con frontmatter, chunking 800 palabras.
- La IA **nunca recibe** el contenido de los documentos.

## Casos soportados

### Consultas de datos
- Consultar órdenes (Orders).
- Consultar clientes (Customers).
- Consultar facturas (Order_Details).
- Rechazar preguntas fuera del dominio.

### Consultas documentales (RAG)
- FAQ: registrar factura, alta de proveedor, plazos de pago.
- Glosario: definición de términos (IVA, RUT, etc.).
- Manuales: procedimientos de pago, políticas internas.

## Estado

Implementado y funcional con documentos de ejemplo en `documents/`.
La columna `embedding` en `document_chunks` está preparada para pgvector
(próxima versión con búsqueda semántica).

No invertir tiempo en autenticación, estilos complejos o persistencia de chat.
