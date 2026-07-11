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
| `document_query` | Consulta documental (FAQ, manuales, glosario) |
| `continuation` | Continuar con el último contexto consultado |
| `unknown` | Fuera del alcance del asistente |

3. Según la intención:

### query
- Validar entidad, filtros y expand contra schema definido.
- Ejecutar consulta OData.
- Formatear datos.
- Enviar al LLM para generar respuesta natural.
- Devolver `{ reply, buttons? }`.

### document_query
- Llamar al Document Engine con `category` y `keywords`.
- Buscar en orden: FAQ → Glosario → Chunks (Full Text Search).
- Devolver el fragmento como `{ reply, type: "document" }`.
- La IA nunca recibe el contenido del documento.

### reply
- Devolver el texto directamente.

### unknown
- Responder que no puede ayudar con esa consulta.

## Endpoints: Documentos

POST /api/documents/index
- Indexa un archivo o directorio completo de documentos.
- Body: `{ path }` o `{ directory }`.
- Soporta: Markdown (con frontmatter), JSON, TXT.

GET /api/documents/search?q=&category=
- Busca fragmentos documentales por keywords.
- Busca primero FAQs (por keywords array), luego glosario (ILIKE), luego chunks (FTS).
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
