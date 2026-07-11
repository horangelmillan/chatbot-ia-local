# Diagrama de Secuencia: Consulta Documental RAG

Flujo completo cuando un proveedor pregunta sobre procesos internos (ej: "Como registro una factura?").

El LLM solo clasifica la intencion — nunca recibe el contenido del documento.

```mermaid
sequenceDiagram
    participant U as Usuario
    participant FE as Frontend (OpenUI5)
    participant BE as Backend (Express)
    participant LLM as LM Studio (Qwen3)
    participant DE as Document Engine
    participant PG as PostgreSQL

    U->>FE: Pregunta sobre proceso
    FE->>BE: POST /api/chat {message, history}
    BE->>LLM: decideAction (temp 0.1)
    LLM-->>BE: {intent:"document_query", category, keywords}
    BE->>DE: search(category, keywords)
    DE->>PG: SELECT FROM faq WHERE keywords @> ARRAY[...]
    alt FAQ encontrada
        PG-->>DE: FAQ row (question + answer oficial)
        DE-->>BE: {type:"faq", data}
        BE-->>FE: {reply: pregunta + respuesta, type:"document"}
    else Sin FAQ
        DE->>PG: SELECT FTS espanol FROM document_chunks<br/>WHERE to_tsvector(content) @@ to_tsquery($1)
        PG-->>DE: Chunk con ts_rank > 0
        DE-->>BE: {type:"chunk", data}
        BE-->>FE: {reply: contenido del chunk, type:"document"}
    end
    FE-->>U: Renderiza burbuja con borde naranja<br/>y cabecera "Documentacion"
    Note over FE: La IA nunca recibe el contenido del documento
```
