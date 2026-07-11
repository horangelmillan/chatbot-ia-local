# Arquitectura del Sistema

## Diagrama de Flujo

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Proveedor  │────▶│  Frontend    │────▶│  Backend      │────▶│  API Cliente │
│  (Browser)  │     │  SAPUI5      │     │  Node.js      │     │  (OData/REST)│
└─────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                          │                      │                      │
                          │                      ▼                      │
                          │              ┌──────────────┐              │
                          │              │  LLM Local   │              │
                          └──────────────│  Qwen3 8B   │              │
                                         │  (LM Studio) │              │
                                         └──────────────┘              │
                                                                        │
                          ┌──────────────────┐                          │
                          │   PostgreSQL     │◀─────────────────────────┘
                          │  chatbot_rag     │
                          │ ─ documents      │
                          │ ─ document_chunks│
                          │ ─ faq            │
                           │ ─ faq            │
                          └──────────────────┘
                               ▲
                               │
                          ┌──────────────┐
                          │  Document    │
                          │  Engine      │
                          │  (Node.js)   │
                          └──────────────┘
                               ▲
                               │
                          ┌──────────────┐
                          │  Indexador   │
                          │  (Node.js)   │
                          └──────────────┘
                               ▲
                               │
                          ┌──────────────┐
                          │  Documentos  │
                          │  (Markdown,  │
                          │   JSON, TXT) │
                          └──────────────┘
```

## Flujo de una consulta

### Escenario A — Consulta de datos (Northwind/SAP)

1. **Usuario escribe** en lenguaje natural: "¿Cuáles facturas se pagaron hoy?"
2. **Frontend** envía mensaje + historial reciente al backend
3. **Backend** consulta al **LLM** (`decideAction`):
   - LLM recibe schema de entidades disponibles
   - Decide: "necesito consultar API del cliente con estos parámetros"
   - Responde con JSON estructurado (ej: `{intent:"query", entity:"Orders", ...}`)
4. **Backend valida** la consulta contra schema definido (no acepta entidades inventadas)
5. **Backend ejecuta** la consulta contra la **API del cliente**
6. **Backend formatea** datos en contexto legible
7. **Backend envía** datos + historial al **LLM** (`generateReply`)
8. **LLM genera** respuesta en lenguaje natural, concisa y basada solo en datos reales
9. **Frontend** muestra la respuesta al proveedor

### Escenario B — Consulta documental (RAG)

1. **Usuario escribe**: "¿Cómo registro una factura de proveedor?"
2. **Backend** consulta al **LLM** (`decideAction`)
3. **LLM** devuelve: `{"intent":"document_query","category":"Facturación","keywords":["factura","registro","proveedor"]}`
4. **Backend** llama al **Document Engine** con categoría + keywords
5. **Document Engine** busca en PostgreSQL: FAQ → Chunks (FTS)
6. **PostgreSQL** devuelve el fragmento oficial
7. **Backend** envía el fragmento al **Frontend** con `type: "document"`
8. **Frontend** renderiza el fragmento con estilo documental (borde naranja, cabecera)
9. **La IA nunca ve el contenido del documento**

## Componentes

### Frontend (SAPUI5)
- Aplicación web OpenUI5 1.150.0
- Interfaz tipo chat con burbujas (usuario derecha, asistente izquierda)
- Envía historial de últimos 20 mensajes en cada request
- Sin dependencias externas, sin API keys

### Backend (Node.js + Express)
- Puerto 3001
- Proxy para desarrollo (ui5-middleware-simpleproxy)
- Caché en memoria de última consulta (`lastContext`)
- PostgreSQL 18 como base de datos documental
- Dependencias adicionales: `pg`, `pdf-parse`, `mammoth`

### LLM Local (LM Studio + Qwen3 8B)
- Modelo: Qwen3 8B (Instruct)
- Cuantización: Q4_K_M (~5GB VRAM)
- Servidor: LM Studio en puerto 1234 (API compatible OpenAI)
- Contexto máximo: 32K tokens (configurable)

### API del Cliente
- Estilo OData o REST
- El chatbot se adapta al schema expuesto
- Solo consulta (GET), no escribe
- Timeout configurable

### Motor Documental (RAG)
- **PostgreSQL 18** — base de datos `chatbot_rag`
- **Document Engine** (`backend/db/engine.js`) — busca fragmentos oficiales en FAQ y chunks documentales
- **Indexador** (`backend/db/indexer.js`) — parsea documentos Markdown/JSON/TXT, divide en chunks de 800 palabras, registra metadatos
- **LLM solo detecta el intent** — nunca recibe el contenido del documento
- APIs: `POST /api/documents/index`, `GET /api/documents/search`, `GET /api/documents/:id`

## Seguridad

- El LLM **no accede directamente** a la base de datos del cliente
- El backend es quien ejecuta las consultas contra la API
- El LLM solo recibe **datos ya filtrados y formateados**
- Schema validation evita que el LLM invente endpoints

## Evolución Arquitectónica

El backend actual sigue un estilo monolítico en capas planas (rutas → base de datos). Como dirección de mejora, se contempla una evolución hacia **Arquitectura Hexagonal (Puertos y Adaptadores)** para separar la lógica de dominio de los detalles de infraestructura (Express, PostgreSQL, LM Studio).

Principios guía para esta evolución:

- **Dominio puro**: reglas de negocio sin imports de frameworks
- **Puertos de salida**: interfaces para repositorios, gateways (LLM, OData)
- **Casos de uso**: orquestación sin acoplamiento a HTTP o bases de datos
- **Adaptadores**: implementaciones concretas en los bordes del sistema
- **Composition Root**: cableado centralizado en un solo punto

La migración se hará por rebanadas verticales (strangler pattern), comenzando por los flujos de mayor cambio.
