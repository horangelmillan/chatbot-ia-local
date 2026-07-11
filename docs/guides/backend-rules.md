# Backend

> **Principio arquitectónico:** El backend debe evolucionar hacia una **Arquitectura Hexagonal (Puertos y Adaptadores)**. La lógica de dominio no debe depender de Express, PostgreSQL, LM Studio ni ninguna infraestructura. Usa el skill `hexagonal-architecture` al crear o refactorizar módulos del backend.

## Endpoint: Chat

POST /api/chat

Body

```json
{
  "message": "texto del usuario",
  "history": [{ "role": "user"|"assistant", "content": "..." }]
}
```

## Flujo

1. Recibir mensaje.
2. Pedir al LLM que clasifique la intención:

| Intent | Descripción |
|--------|-------------|
| `query` | Consulta a Northwind (OData) |
| `reply` | Respuesta directa del LLM (saludos, análisis, etc.) |
| `document_query` | Consulta documental (FAQ, manuales) |
| `continuation` | Continuar con el último contexto consultado |
| `unknown` | Fuera del alcance del asistente |

3. Según la intención:

### query
- Validar entidad, filtros y expand contra schema definido.
- Ejecutar consulta OData.
- **Enriquecer contexto** (si es `Orders`: calcular total + buscar órdenes similares del mismo cliente).
- **Formatear datos en contexto legible** (`buildContext`: texto plano con totales, productos, órdenes similares).
- **Actualizar `lastContext`** con la entidad consultada.
- Enviar datos formateados + historial al LLM (`generateReply`).
- Devolver `{ reply, buttons? }`.

### document_query
- Llamar al Document Engine con `category` y `keywords`.
- Buscar en orden: FAQ → Chunks (Full Text Search).
- Devolver el fragmento como `{ reply, type: "document" }`.
- La IA nunca recibe el contenido del documento.

### continuation
- Verificar que exista un contexto previo (`lastContext`).
- Si no existe, responder: "Aún no has consultado nada, pregúntame por alguna orden o cliente."
- Si existe, enviar el mensaje actual + `lastContext.context` + historial al LLM (`generateReply`).
- Devolver la respuesta generada.

### reply
- Devolver el texto directamente.

### unknown
- Responder que no puede ayudar con esa consulta.

## Endpoint: Configuración

GET /api/config
- Expone parámetros de configuración del backend.
- Respuesta: `{ chatHistoryLimit: 6 }` — el frontend lo consulta al iniciar para sincronizar `MAX_HISTORY`.

## Endpoints: Documentos

POST /api/documents/index
- Indexa un archivo o directorio completo de documentos.
- Body: `{ path }` o `{ directory }`.
- Soporta: Markdown (con frontmatter), JSON, TXT.

GET /api/documents/search?q=&category=
- Busca fragmentos documentales por keywords.
- Busca primero FAQs (por keywords array), luego chunks (FTS).
- Devuelve el fragmento más relevante.

GET /api/documents/:id
- Obtiene un documento completo con todos sus chunks.

## Formato de documentos

Los documentos Markdown deben incluir frontmatter:

```markdown
---
code: FAQ-001
category: Facturacion
keywords: [factura, proveedor, registro]
question: ¿Cómo registro una factura?
answer: Para registrar una factura...
---
```

Si incluyen `question` y `answer`, se indexan también como FAQ.
