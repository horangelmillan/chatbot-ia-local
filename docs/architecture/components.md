# Diagrama de Componentes del Backend (C4 L3)

El backend Express está en migración progresiva hacia **Arquitectura Hexagonal (Puertos y Adaptadores)** vía patrón Strangler Fig.

## Estado actual (Slices 1-2 completados)

Los puertos `DocumentRepositoryPort` y `DocumentIndexerPort` han sido extraídos. El backend legacy en `db/` se ha reducido a solo `schema.sql`.

| Componente | Archivo | Capa | Responsabilidad |
|-----------|---------|------|----------------|
| Chat Router | `routes/chat.js` | Inbound Adapter (legacy) | Orquesta el flujo de consulta: decideAction, validacion, queryNorthwind, buildContext, generateReply |
| Documents Router | `routes/documents.js` | Inbound Adapter (legacy) | CRUD documental: indexado, busqueda y recuperacion de documentos |
| PG Pool | `db/pool.js` / `src/shared/adapters/outbound/postgres/pool.js` | Compartido | Pool de conexiones PostgreSQL (max 5, timeout 30s) |
| LM Client | (axios en chat.js) | Outbound Adapter (legacy) | Cliente HTTP para API compatible OpenAI de LM Studio |
| **DocumentRepositoryPort** | `src/features/documents/application/ports/outbound/DocumentRepositoryPort.js` | **Application (Puerto)** | Contrato de busqueda documental: search, searchFAQ, searchChunks |
| **DocumentIndexerPort** | `src/features/documents/application/ports/outbound/DocumentIndexerPort.js` | **Application (Puerto)** | Contrato de indexación: indexDocument, indexDirectory |
| **PostgresDocumentRepository** | `src/features/documents/adapters/outbound/postgres/PostgresDocumentRepository.js` | **Infrastructure (Adaptador)** | Busqueda en cascada: FAQ (keywords array) → Chunks (FTS espanol) |
| **PostgresDocumentIndexer** | `src/features/documents/adapters/outbound/postgres/PostgresDocumentIndexer.js` | **Infrastructure (Adaptador)** | Parseo, chunking y persistencia de documentos |
| **documentsContainer** | `src/features/documents/composition/documentsContainer.js` | **Composition Root** | Wiring de repositorio + indexador |

```mermaid
graph TB
    subgraph "Backend - Capa de Infraestructura"
        CR["Chat Router<br/>routes/chat.js"]
        DR["Documents Router<br/>routes/documents.js"]
        PL["PG Pool<br/>src/shared/.../pool.js"]
    end

    subgraph "Backend - Adaptadores Extraidos (Hexagonal)"
        PDR["PostgresDocumentRepository<br/>src/features/.../"]
        PDI["PostgresDocumentIndexer<br/>src/features/.../"]
    end

    subgraph "Backend - Capa de Aplicacion"
        DRP["DocumentRepositoryPort<br/>(contrato)"]
        DIP["DocumentIndexerPort<br/>(contrato)"]
    end

    subgraph "Backend - Composition"
        DC["documentsContainer"]
    end

    subgraph "Sistemas Externos"
        LLM["LM Studio :1234"]
        PG[("PostgreSQL 18<br/>chatbot_rag")]
        NW["Northwind OData"]
    end

    DC -->|"buildDocumentRepository()"| PDR
    DC -->|"buildDocumentIndexer()"| PDI
    DR -->|"usa"| DC
    CR -->|"usa"| DC
    PDR -.->|"implementa"| DRP
    PDI -.->|"implementa"| DIP
    CR -->|"decideAction / generateReply<br/>axios HTTP"| LLM
    CR -->|"validateQuery / queryNorthwind<br/>axios HTTP"| NW
    DR -->|"SELECT directo"| PL
    PDR -->|"SELECT FAQ (keywords)<br/>SELECT Chunks (FTS)"| PL
    PDI -->|"INSERT documentos + chunks"| PL
    PL -->|"SQL"| PG

    style CR fill:#438dd5,color:#fff
    style DR fill:#438dd5,color:#fff
    style PL fill:#85bbf0,color:#000
    style PDR fill:#5cb85c,color:#fff
    style PDI fill:#5cb85c,color:#fff
    style DRP fill:#f0ad4e,color:#fff
    style DIP fill:#f0ad4e,color:#fff
    style DC fill:#5bc0de,color:#fff
    style LLM fill:#999999,color:#fff
    style NW fill:#999999,color:#fff
    style PG fill:#999999,color:#fff
```

> **Nota:** Componentes en verde = hexagonales extraídos. Azul oscuro = legacy. Este diagrama se actualiza con cada slice completado.

