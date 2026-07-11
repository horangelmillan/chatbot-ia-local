# Diagrama de Contenedores (C4 L2)

El sistema se compone de dos contenedores principales (Frontend y Backend) y tres sistemas externos.

**Frontend (OpenUI5 1.150):**
- SPA tipo chat con burbujas de usuario (derecha) y asistente (izquierda)
- Botones dinamicos generados por el LLM con estados visuales (activo: Emphasized, seleccionado: Accept, deshabilitado: Default)
- Renderizado diferenciado para fragmentos documentales (borde naranja, cabecera)
- Envia historial de ultimos 6 mensajes en cada request (configurable via CHAT_HISTORY_LIMIT)
- Sin dependencias externas ni API keys

**Backend (Node.js 22 + Express 4):**
- API REST en puerto 3001
- Clasifica intencion via LLM: query, reply, document_query, continuation, unknown
- Valida consultas contra schema definido (entidades, filtros, expand)
- Ejecuta busqueda documental en cascada: FAQ → Chunks (FTS)
- Cache en memoria lastContext para continuacion de conversacion

```mermaid
graph TB
    subgraph "Navegador"
        FE["Frontend<br/>OpenUI5 1.150<br/>SPA Chat"]
    end
    subgraph "Servidor Node.js"
        BE["Backend<br/>Express 4<br/>API REST :3001"]
    end
    subgraph "Servidor GPU"
        LLM["LM Studio<br/>Qwen3 8B Q4_K_M<br/>API OpenAI :1234"]
    end
    subgraph "Servidor DB"
        PG[("PostgreSQL 18<br/>chatbot_rag")]
    end
    subgraph "Cloud"
        NW["Northwind OData<br/>services.odata.org<br/>V3<br/>(demo: sustituye a SAP S/4HANA Cloud)"]
    end

    FE -->|"HTTP POST/GET<br/>JSON"| BE
    BE -->|"HTTP POST<br/>chat/completions"| LLM
    BE -->|"HTTP GET<br/>OData"| NW
    BE -->|"SQL<br/>FTS espanol"| PG

    style FE fill:#0056b3,color:#fff
    style BE fill:#1168bd,color:#fff
    style LLM fill:#999999,color:#fff
    style NW fill:#999999,color:#fff
    style PG fill:#999999,color:#fff
```
