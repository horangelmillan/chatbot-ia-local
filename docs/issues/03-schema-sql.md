# Issue 03: No existe `schema.sql` con el DDL de la base de datos ✅ RESUELTO

## Prioridad: 🔴 Crítica

## Documentación afectada
- `docs/guides/rag-concept.md` — modelo de datos de todas las tablas (líneas 182-241)
- Todo el backend que depende de PostgreSQL (`db/pool.js`, `db/engine.js`, `db/indexer.js`, `routes/documents.js`)

## Qué dice la documentación
La documentación describe cuatro tablas:

**`documents`**: `id`, `code`, `title`, `category`, `file_name`, `file_path`, `version`, `status`, `checksum`, `created_at`, `updated_at`

**`document_chunks`**: `id`, `document_id`, `chunk_number`, `title`, `content`, `page`, `token_count`, `embedding`, `created_at`

**`faq`**: `id`, `code`, `question`, `answer`, `category`, `keywords`, `version`

Además se mencionan:
- Full Text Search en español con `tsvector`
- Clave foránea `document_id` → `documents.id`
- Columna `embedding` preparada para pgvector
- `ON CONFLICT (code) DO UPDATE` en FAQ

## Qué hace realmente el código
No existe ningún archivo `.sql` en el repositorio. No hay script de inicialización, migración, ni DDL documentado más allá del markdown.

El código asume que las tablas ya existen con los nombres de columna exactos que usa en los INSERTs y SELECTs. Cualquier desarrollador nuevo no puede levantar el proyecto sin deducir el schema desde el código.

## Propuesta de corrección
Crear `backend/db/schema.sql` con el DDL completo:

```sql
CREATE DATABASE chatbot_rag;

CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(500),
    category VARCHAR(100) DEFAULT 'general',
    file_name VARCHAR(500),
    file_path TEXT,
    version VARCHAR(50) DEFAULT '1.0',
    status VARCHAR(50) DEFAULT 'active',
    checksum VARCHAR(64),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE document_chunks (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    chunk_number INTEGER,
    title VARCHAR(500),
    content TEXT,
    page INTEGER,
    token_count INTEGER,
    embedding TEXT,  -- NULL en v1, migrar a VECTOR(768) con pgvector
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE faq (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    question TEXT,
    answer TEXT,
    category VARCHAR(100),
    keywords TEXT[],
    version VARCHAR(50) DEFAULT '1.0'
);

-- Índices para búsqueda
CREATE INDEX idx_document_chunks_fts ON document_chunks USING GIN(to_tsvector('spanish', content));
CREATE INDEX idx_faq_keywords ON faq USING GIN(keywords);
```

## Resolución

Creado `backend/db/schema.sql` con DDL completo de las 3 tablas activas:
- `documents` — con código único, metadatos y control de versiones
- `document_chunks` — con foreign key a documents, preparado para embedding (TEXT NULL v1)
- `faq` — con keywords array y upsert por code

La tabla `glossary` fue excluida (ver Issue 02).

## Impacto del cambio

| Aspecto | Detalle |
|---------|---------|
| **Archivos a crear** | `backend/db/schema.sql` |
| **Riesgo** | Bajo — formaliza lo que ya asume el código |
| **Dependencias** | Ninguna, pero es prerequisito lógico para Issues 01 y 02 |
| **Verificación** | Ejecutar `psql -f backend/db/schema.sql` y verificar que las tablas existen con `\dt chatbot_rag` |
