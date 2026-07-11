# Diagrama de Componentes del Backend (C4 L3)

El backend Express se compone de seis modulos internos que se comunican entre si y con los sistemas externos.

| Componente | Archivo | Responsabilidad |
|-----------|---------|----------------|
| Chat Router | `routes/chat.js` | Orquesta el flujo completo de consulta: decideAction, validacion, queryNorthwind, buildContext, generateReply |
| Documents Router | `routes/documents.js` | CRUD documental: indexado, busqueda y recuperacion de documentos |
| Document Engine | `db/engine.js` | Busqueda en cascada: FAQ (keywords array) → Glosario (ILIKE) → Chunks (FTS espanol) |
| Indexer | `db/indexer.js` | Parseo de Markdown/JSON/TXT, extraccion de frontmatter, chunking de 800 palabras |
| PG Pool | `db/pool.js` | Pool de conexiones PostgreSQL (max 5, timeout 30s) |
| LM Client | (axios en chat.js) | Cliente HTTP para API compatible OpenAI de LM Studio |

```mermaid
graph TB
    subgraph "Backend - Modulos Internos"
        CR["Chat Router<br/>routes/chat.js"]
        DR["Documents Router<br/>routes/documents.js"]
        DE["Document Engine<br/>db/engine.js"]
        IX["Indexer<br/>db/indexer.js"]
        PL["PG Pool<br/>db/pool.js"]
    end

    subgraph "Sistemas Externos"
        LLM["LM Studio :1234"]
        PG[("PostgreSQL 18<br/>chatbot_rag")]
        NW["Northwind OData"]
    end

    CR -->|"decideAction / generateReply<br/>axios HTTP"| LLM
    CR -->|"search(category, keywords)"| DE
    CR -->|"validateQuery / queryNorthwind<br/>axios HTTP"| NW
    DR -->|"indexDocument / indexDirectory"| IX
    DR -->|"search"| DE
    DR -->|"SELECT directo"| PL
    IX -->|"INSERT documentos + chunks"| PL
    DE -->|"SELECT FAQ (keywords)<br/>SELECT Glosario (ILIKE)<br/>SELECT Chunks (FTS)"| PL
    PL -->|"SQL"| PG

    style CR fill:#438dd5,color:#fff
    style DR fill:#438dd5,color:#fff
    style DE fill:#85bbf0,color:#000
    style IX fill:#85bbf0,color:#000
    style PL fill:#85bbf0,color:#000
    style LLM fill:#999999,color:#fff
    style NW fill:#999999,color:#fff
    style PG fill:#999999,color:#fff
```
