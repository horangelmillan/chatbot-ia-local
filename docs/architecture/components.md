# Diagrama de Componentes del Backend (C4 L3)

El backend Express está en migración progresiva hacia **Arquitectura Hexagonal (Puertos y Adaptadores)** vía patrón Strangler Fig.

## Estado actual (Slices 1-4 completados — migración completa)

Todos los puertos y adaptadores han sido extraídos. El backend legacy en `db/` solo contiene `schema.sql`. `routes/chat.js` es un inbound adapter delgado (~25 líneas) que delega toda la orquestación en `ChatUseCase`.

| Componente | Archivo | Capa | Responsabilidad |
|-----------|---------|------|----------------|
| Chat Router | `routes/chat.js` | **Inbound Adapter** | Parsea HTTP Request → llama a ChatUseCase → responde JSON |
| Documents Router | `routes/documents.js` | Inbound Adapter (legacy) | CRUD documental: indexado, busqueda y recuperacion |
| PG Pool | `db/pool.js` / `src/shared/adapters/outbound/postgres/pool.js` | Compartido | Pool de conexiones PostgreSQL (max 5, timeout 30s) |
| **DocumentRepositoryPort** | `src/features/documents/application/ports/outbound/DocumentRepositoryPort.js` | **Application (Puerto)** | Contrato de busqueda documental: search, searchFAQ, searchChunks |
| **DocumentIndexerPort** | `src/features/documents/application/ports/outbound/DocumentIndexerPort.js` | **Application (Puerto)** | Contrato de indexación: indexDocument, indexDirectory |
| **LLMPort** | `src/features/chat/application/ports/outbound/LLMPort.js` | **Application (Puerto)** | Contrato de inferencia LLM: chatCompletion |
| **ODataPort** | `src/features/chat/application/ports/outbound/ODataPort.js` | **Application (Puerto)** | Contrato de consultas OData (Northwind / SAP S/4HANA) |
| **ChatContextPort** | `src/features/chat/application/ports/outbound/ChatContextPort.js` | **Application (Puerto)** | Contrato de contexto conversacional |
| **ChatUseCase** | `src/features/chat/application/use-cases/ChatUseCase.js` | **Application (Caso de uso)** | Orquestación completa: decideAction, validacion, query, generateReply |
| **PostgresDocumentRepository** | `src/features/documents/adapters/outbound/postgres/PostgresDocumentRepository.js` | **Infrastructure (Adaptador)** | Busqueda en cascada: FAQ → Chunks FTS |
| **PostgresDocumentIndexer** | `src/features/documents/adapters/outbound/postgres/PostgresDocumentIndexer.js` | **Infrastructure (Adaptador)** | Parseo, chunking y persistencia |
| **LmStudioAdapter** | `src/features/chat/adapters/outbound/lmstudio/LmStudioAdapter.js` | **Infrastructure (Adaptador)** | Cliente HTTP para LM Studio |
| **NorthwindODataAdapter** | `src/features/chat/adapters/outbound/northwind/NorthwindODataAdapter.js` | **Infrastructure (Adaptador)** | Cliente HTTP para Northwind OData + config ALLOWED |
| **InMemoryChatContext** | `src/features/chat/adapters/outbound/memory/InMemoryChatContext.js` | **Infrastructure (Adaptador)** | Contexto conversacional en memoria |
| **documentsContainer** | `src/features/documents/composition/documentsContainer.js` | **Composition Root** | Wiring documental |
| **chatContainer** | `src/features/chat/composition/chatContainer.js` | **Composition Root** | Wiring del chat + LLM + OData + contexto |

```mermaid
graph TB
    subgraph "Inbound Adapters (Express)"
        CR["ChatController<br/>routes/chat.js"]
        DR["DocumentsController<br/>routes/documents.js"]
    end

    subgraph "Composition Root"
        DC["documentsContainer"]
        CC["chatContainer"]
    end

    subgraph "Application Layer (Use Cases + Ports)"
        CU["ChatUseCase"]
        subgraph "Puertos"
            DRP["DocumentRepositoryPort"]
            DIP["DocumentIndexerPort"]
            LLP["LLMPort"]
            ODP["ODataPort"]
            CCP["ChatContextPort"]
        end
    end

    subgraph "Outbound Adapters"
        PDR["PostgresDocumentRepository"]
        PDI["PostgresDocumentIndexer"]
        LMS["LmStudioAdapter"]
        NWO["NorthwindODataAdapter"]
        IMC["InMemoryChatContext"]
    end

    subgraph "Sistemas Externos"
        LLM["LM Studio :1234"]
        PG[("PostgreSQL 18")]
        NW["Northwind OData"]
    end

    CU -->|"usa"| DRP
    CU -->|"usa"| LLP
    CU -->|"usa"| ODP
    CU -->|"usa"| CCP

    PDR -.->|"implementa"| DRP
    PDI -.->|"implementa"| DIP
    LMS -.->|"implementa"| LLP
    NWO -.->|"implementa"| ODP
    IMC -.->|"implementa"| CCP

    DC --> PDR
    DC --> PDI
    CC --> CU
    CC --> LMS
    CC --> NWO
    CC --> IMC
    CC --> DC

    CR --> CC
    DR -->|"indexDocument / SELECT directo"| DC

    LMS --> LLM
    NWO --> NW
    PDR --> PL["PG Pool"]
    PDI --> PL
    PL --> PG

    style CR fill:#5cb85c,color:#fff
    style DR fill:#438dd5,color:#fff
    style CU fill:#f0ad4e,color:#fff
    style DRP fill:#f0ad4e,color:#fff
    style DIP fill:#f0ad4e,color:#fff
    style LLP fill:#f0ad4e,color:#fff
    style ODP fill:#f0ad4e,color:#fff
    style CCP fill:#f0ad4e,color:#fff
    style PDR fill:#5cb85c,color:#fff
    style PDI fill:#5cb85c,color:#fff
    style LMS fill:#5cb85c,color:#fff
    style NWO fill:#5cb85c,color:#fff
    style IMC fill:#5cb85c,color:#fff
    style DC fill:#5bc0de,color:#fff
    style CC fill:#5bc0de,color:#fff
```

> **Nota:** Verde = inbound/outbound adapters. Naranja = aplicación/puertos. Azul claro = composition. La migración hexagonal está completa.

