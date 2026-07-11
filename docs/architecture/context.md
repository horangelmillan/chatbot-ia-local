# Diagrama de Contexto (C4 L1)

El sistema **SAPUI5 Chat** es un asistente conversacional que permite a proveedores consultar datos de negocio (facturas, pedidos, clientes) y documentacion corporativa (FAQ, manuales) mediante lenguaje natural.

El sistema se integra con tres sistemas externos:
- **LM Studio** — inferencia local del LLM (Qwen3 8B) para clasificar intenciones y generar respuestas
- **Northwind OData** — API externa con datos de negocio (solo consulta)
- **PostgreSQL 18** — base de datos documental con busqueda de texto completo en espanol

```mermaid
graph TB
    P["Proveedor"] -->|"Consulta en lenguaje natural"| CHAT["SAPUI5 Chat"]
    CHAT -->|"decideAction + generateReply"| LLM["LM Studio<br/>Qwen3 8B"]
    CHAT -->|"GET OData validado"| NW["Northwind OData"]
    CHAT -->|"Busqueda documental"| PG[("PostgreSQL 18<br/>chatbot_rag")]

    style P fill:#08427b,color:#fff
    style CHAT fill:#1168bd,color:#fff
    style LLM fill:#999999,color:#fff
    style NW fill:#999999,color:#fff
    style PG fill:#999999,color:#fff
```
