# Especificación Técnica
# Motor de Recuperación Documental (RAG)

## Objetivo

Implementar un motor de recuperación documental (Retrieval Augmented Generation - RAG) desacoplado del ERP SAP S/4HANA Cloud. En la demo actual, los datos de negocio se consultan mediante **Northwind OData** (`services.odata.org`) como sustituto del ERP real.

Su responsabilidad será localizar información oficial dentro de documentación corporativa (manuales, procedimientos y preguntas frecuentes) para que el Backend pueda responder consultas documentales sin depender del conocimiento interno del modelo LLM.

El motor RAG NO toma decisiones de negocio, NO consulta SAP y NO genera respuestas finales. Su única responsabilidad es localizar el contenido oficial más relevante.

---

# Arquitectura

```
                 Documentos

      PDF
      DOCX
      Markdown
      JSON

             │
             ▼

      Servicio de Indexación

             │

             ▼

         PostgreSQL

      documents
      document_chunks
      faq

             ▲

             │

      Document Engine

             ▲

             │

      Backend Node.js

             ▲

             │

           IA Local
```

---

# Responsabilidades

## Servicio de Indexación

Se ejecuta únicamente cuando se agregan o modifican documentos.

Responsabilidades:

- Leer documentos.
- Extraer texto.
- Normalizar contenido.
- Dividir en fragmentos.
- Registrar metadata.
- Actualizar el índice documental.

No participa durante las consultas de usuarios.

---

## Document Engine

Responsable de recuperar información.

Funciones:

- Buscar documentos.
- Buscar FAQs.
- Obtener fragmentos.
- Validar versiones.
- Entregar únicamente contenido oficial.

No interpreta lenguaje natural.

---

# Flujo de Indexación

```
Nuevo documento

↓

Parser

↓

Texto plano

↓

Normalización

↓

Separación por capítulos

↓

Chunking

↓

Guardar índice

↓

Finalizar
```

---

# Formatos soportados

| Formato | Librería | Estado |
|----------|----------|:------:|
| PDF | pdf-parse | ❌ Pendiente (v2) |
| DOCX | mammoth | ❌ Pendiente (v2) |
| Markdown | fs (lectura directa + regex) | ✅ v1 |
| JSON | JSON.parse | ✅ v1 |

Todos los formatos deberán convertirse a texto plano antes de ser procesados.

---

# Estrategia de Chunking

Cada documento será dividido en fragmentos independientes.

Reglas:

- Máximo 800 palabras por fragmento.
- Mantener títulos.
- Mantener numeración.
- No cortar tablas.
- No dividir listas.
- Mantener referencia de página cuando exista.

Ejemplo

```
DOC-010

↓

DOC-010-001

↓

DOC-010-002

↓

DOC-010-003
```

Cada fragmento será recuperable individualmente.

---

# Modelo de Datos

## documents

```
id
code
title
category
file_name
file_path
version
status
checksum
created_at
updated_at
```

---

## document_chunks

```
id
document_id
chunk_number
title
content
page
token_count
embedding (TEXT, NULL en v1)
created_at
```

embedding permanecerá NULL en la primera versión. En v2 se migrará a `VECTOR(768)` con pgvector.

---

## faq

```
id
code
question
answer
category
keywords
version
```

---



# Estrategia de Recuperación

La recuperación documental NO será realizada por el modelo LLM.

El flujo será:

```
Usuario

↓

Backend

↓

IA Local

↓

Intent

↓

Backend

↓

Document Engine

↓

PostgreSQL

↓

Fragmento

↓

Frontend
```

La IA únicamente devolverá una estructura indicando la intención detectada.

Ejemplo:

```json
{
    "intent": "DOCUMENT_QUERY",
    "category": "Facturación",
    "keywords": [
        "factura",
        "proveedor",
        "registro"
    ]
}
```

El Backend utilizará esta información para consultar el índice documental.

---

# Algoritmo de búsqueda

Primera versión:

1. Buscar FAQs.
2. Buscar Chunks mediante:
   - categoría
   - palabras clave
   - Full Text Search PostgreSQL

Seleccionar el fragmento con mayor relevancia.

---

# Preparación para búsqueda semántica

La arquitectura deberá quedar preparada para incorporar pgvector sin modificar el modelo de datos.

Cada fragmento dispondrá de un campo:

```
embedding VECTOR(768)
```

En la v1 (actual) es `TEXT NULL`. En v2 se migrará a `VECTOR(768)` con pgvector y se generará utilizando un modelo de embeddings local.

Ejemplo:

```
nomic-embed-text

o

bge-small
```

---

# Versionado

Cada documento tendrá:

- versión
- checksum
- fecha actualización

Cuando un documento cambie:

- eliminar chunks antiguos
- regenerar chunks
- actualizar índice

---

# Almacenamiento

Los documentos originales NO serán almacenados en PostgreSQL.

Ubicación:

```
knowledge-base/

manuals/

procedures/

faq/
```

PostgreSQL únicamente almacenará:

- metadata
- índice
- fragmentos
- referencias

---

# API interna

POST

```
/documents/index
```

Indexa un documento.

---

GET

```
/documents/search
```

Recupera fragmentos.

---

GET

```
/documents/:id
```

Obtiene documento.

---

GET

```
/faq/search
```

Busca preguntas frecuentes.

---

# Restricciones

El motor documental:

- No modifica documentos.
- No responde consultas.
- No consulta SAP.
- No genera texto.
- No utiliza el modelo LLM para responder.

Su única responsabilidad es localizar información oficial y devolver el fragmento correspondiente al Backend.

---

# Estado de Implementación (v1 — Julio 2026)

| Componente | Estado |
|-----------|:------:|
| PostgreSQL (`chatbot_rag`) | ✅ Implementado |
| Tabla `documents` | ✅ Implementado |
| Tabla `document_chunks` (con embedding NULL) | ✅ Implementado |
| Tabla `faq` | ✅ Implementado |

| Full Text Search (tsvector español) | ✅ Implementado |
| Indexador (Markdown, JSON, TXT) | ✅ Implementado |
| Indexador (PDF, DOCX) | ❌ Pendiente |
| Document Engine (FAQ → Chunks) | ✅ Implementado |
| POST /api/documents/index | ✅ Implementado |
| GET /api/documents/search | ✅ Implementado |
| GET /api/documents/faq/search | ✅ Implementado |
| GET /api/documents/:id | ✅ Implementado |
| LLM detecta `document_query` intent | ✅ Implementado |
| Frontend renderiza fragmentos documentales | ✅ Implementado |
| pgvector / búsqueda semántica | ⏳ Preparado (columna embedding) |
| Reranking | ❌ Pendiente |
| OCR | ❌ Pendiente |
| SharePoint / SAP Object Store | ❌ Pendiente |
| Administración web de documentos | ❌ Pendiente |

---

# Implementación Actual

## Backend — Módulos

### `backend/db/pool.js`
Pool de conexiones PostgreSQL (max 5 conexiones, timeout 30s).

### `backend/db/indexer.js`
- Parsea Markdown con frontmatter (código, categoría, keywords, pregunta/respuesta).
- Divide en chunks por secciones (máximo 800 palabras).
- Si el documento tiene `question` + `answer` en frontmatter, lo registra también como FAQ.
- Re-indexa: si el código ya existe, elimina chunks antiguos y regenera.

### `backend/db/engine.js`
Orden de búsqueda:
1. **FAQ** — coincidencia exacta en array `keywords` + filtro por categoría.
2. **Chunks** — PostgreSQL Full Text Search en español con ranking (`ts_rank`).

### `backend/routes/documents.js`
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/documents/index` | Indexa archivo (`path`) o directorio (`directory`) |
| GET | `/api/documents/search?q=&category=` | Busca fragmento por keywords + categoría |
| GET | `/api/documents/faq/search?q=&category=` | Busca solo FAQs |
| GET | `/api/documents/:id` | Obtiene documento completo + chunks |

### `backend/routes/chat.js` — Modificaciones
- System prompt extendido con categorías documentales y formato `document_query`.
- Nuevo handler para `intent: "document_query"`: llama a `engine.search()` y devuelve el fragmento con `type: "document"`.
- La IA **nunca recibe el contenido del documento**, solo clasifica intención y keywords.

## Frontend

### `webapp/controller/App.controller.js`
- `_addMessage()` acepta parámetro `type`.
- `itemFactory()` aplica clase `docBubble` cuando `type === "document"`.

### `webapp/css/style.css`
- Clase `.docBubble`: fondo amarillo claro, borde izquierdo naranja, cabecera "📄 Documentación".

---



# Futuras mejoras

- pgvector y búsqueda semántica
- Reranking
- OCR (PDF escaneados)
- SharePoint / SAP Object Store
- Versionado automático
- Cache de consultas
- Administración documental desde interfaz web