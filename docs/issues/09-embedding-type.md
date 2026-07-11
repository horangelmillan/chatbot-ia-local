# Issue 09: Tipo de columna `embedding` contradictorio: TEXT vs VECTOR

## Prioridad: 🟠 Moderada

## Documentación afectada
- `docs/guides/rag-concept.md` — modelo de datos `document_chunks` (líneas 203-213 y 328) y estado de implementación (línea 518)

## Qué dice la documentación
En el modelo de datos (línea 210):
```
embedding
```

Sin tipo explícito. Luego en la sección "Preparación para búsqueda semántica" (línea 328):
```
embedding VECTOR
```

Pero en "Implementación Actual → Base de Datos" (línea 518):
> Columna `embedding` en `document_chunks` como **TEXT** (NULL en v1).

Hay tres versiones diferentes del tipo de `embedding`:
1. Sin tipo definido (modelo de datos)
2. `VECTOR` (preparación para pgvector)
3. `TEXT` (implementación actual)

## Qué hace realmente el código
El indexador nunca inserta en la columna `embedding`:

```js
// indexer.js línea 104-106
await pool.query(
  "INSERT INTO document_chunks (document_id, chunk_number, title, content, token_count) VALUES ($1,$2,$3,$4,$5)",
  ...
);
```

La columna existe en la BD (según la documentación, no hay DDL para verificarlo) pero nunca se escribe ni se lee. No hay código que defina el tipo real de la columna.

## Propuesta de corrección

### Opción A: Unificar documentación como `TEXT` (v1) → `VECTOR(768)` (v2)
Documentar claramente:
- **v1 (actual)**: `embedding TEXT NULL` — placeholder, no se usa
- **v2 (futuro)**: migrar a `embedding VECTOR(768)` con pgvector y generar embeddings con `nomic-embed-text` o `bge-small`

### Opción B: Decidir tipo final desde ahora
Si se planea usar pgvector próximamente, definir el tipo real desde el schema:

```sql
embedding vector(768)  -- con extensión pgvector habilitada
```

## Impacto del cambio

| Aspecto | Detalle |
|---------|---------|
| **Archivos a modificar** | `docs/guides/rag-concept.md` (líneas 210, 328, 518) y opcionalmente `backend/db/schema.sql` (si se crea en Issue 03) |
| **Riesgo** | Bajo — solo documentación |
| **Dependencias** | Issue 03 (schema.sql) para aplicarlo al DDL |
| **Verificación** | Revisión visual de consistencia |
