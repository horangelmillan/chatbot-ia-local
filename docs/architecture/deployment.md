# Diagrama de Despliegue (C4 L4)

El sistema se despliega en un entorno local con cuatro nodos fisicos/logicos mas el acceso del proveedor via browser.

| Nodo | Tecnologia | Detalle |
|------|-----------|---------|
| Dispositivo Proveedor | Browser | Chrome/Edge/Firefox, acceso HTTP a Frontend |
| Servidor Backend | Node.js 22 | Express en puerto 3001, comunicacion con LM Studio (localhost:1234) |
| Servidor GPU | LM Studio | GPU 16GB+ VRAM, Qwen3 8B Q4_K_M, contexto 32K tokens |
| Servidor DB | PostgreSQL 18 | Base de datos chatbot_rag, FTS espanol |
| Cloud | Northwind OData | API externa services.odata.org, solo GET. Sustituye a SAP S/4HANA Cloud (demo) |

```mermaid
graph TB
    subgraph "Local"
        subgraph "Proveedor"
            BROWSER["Browser<br/>Chrome/Edge/Firefox"]
        end
        subgraph "Servidor Backend (LAN)"
            BE["Node.js 22<br/>Express :3001<br/>Windows/Linux"]
        end
        subgraph "Servidor GPU"
            LMS["LM Studio<br/>Qwen3 8B Q4_K_M<br/>:1234<br/>GPU 16GB+ VRAM"]
        end
        subgraph "Servidor Base de Datos"
            PG[("PostgreSQL 18<br/>chatbot_rag")]
        end
    end
    subgraph "Internet"
        NW["Northwind OData<br/>services.odata.org<br/>V3<br/>(demo: sustituye a SAP S/4HANA Cloud)"]
    end

    BROWSER -->|"HTTP :3001<br/>POST /api/chat"| BE
    BE -->|"HTTP :1234<br/>chat/completions"| LMS
    BE -->|"SQL<br/>localhost"| PG
    BE -->|"HTTPS<br/>OData GET"| NW

    style BROWSER fill:#0056b3,color:#fff
    style BE fill:#1168bd,color:#fff
    style LMS fill:#999999,color:#fff
    style PG fill:#999999,color:#fff
    style NW fill:#999999,color:#fff
```
