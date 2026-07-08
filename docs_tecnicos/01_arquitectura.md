# Arquitectura del Sistema

## Diagrama de Flujo

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Proveedor  │────▶│  Frontend    │────▶│  Backend      │────▶│  API Cliente │
│  (Browser)  │     │  SAPUI5      │     │  Node.js      │     │  (OData/REST)│
└─────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                          │                      │
                          │                      ▼
                          │              ┌──────────────┐
                          │              │  LLM Local   │
                          └──────────────│  Qwen3 8B   │
                                         │  (LM Studio) │
                                         └──────────────┘
```

## Flujo de una consulta

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
- Sin base de datos, sin estado persistente

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

## Seguridad

- El LLM **no accede directamente** a la base de datos del cliente
- El backend es quien ejecuta las consultas contra la API
- El LLM solo recibe **datos ya filtrados y formateados**
- Schema validation evita que el LLM invente endpoints
