# Ejercicios — Fase 04: Patrones BD

```bash
git checkout master
git checkout -b growth/fase-04-patterns-bd
```

## Ejercicio 1: Transacciones en indexDocument()

**Archivo:** `backend/src/features/documents/adapters/outbound/postgres/PostgresDocumentIndexer.js`

Envolver el DELETE + INSERT en una transacción:

```javascript
const client = await pool.connect();
try {
  await client.query("BEGIN");

  if (existing.rows.length > 0) {
    await client.query("DELETE FROM document_chunks WHERE document_id = $1", [existing.rows[0].id]);
    await client.query("DELETE FROM documents WHERE id = $1", [existing.rows[0].id]);
  }

  const docResult = await client.query(
    "INSERT INTO documents (...) VALUES (...) RETURNING id",
    [values]
  );
  const docId = docResult.rows[0].id;

  for (const chunk of chunks) {
    await client.query(
      "INSERT INTO document_chunks (...) VALUES (...)",
      [docId, chunk.title, ...]
    );
  }

  await client.query("COMMIT");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
}
```

## Ejercicio 2: Refactorizar repositorio a clase instanciable

**Archivo:** `backend/src/features/documents/adapters/outbound/postgres/PostgresDocumentRepository.js`

```javascript
class PostgresDocumentRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async searchFAQ(category, keywords) {
    this.pool.query(...)
  }
  // ... mantener todos los métodos
}
```

Luego actualizar `documentsContainer.js`:

```javascript
function buildDocumentRepository() {
  return new PostgresDocumentRepository(pool);
}
```

## Commits

```bash
git commit -m "feat: agregar transacciones a PostgresDocumentIndexer.indexDocument"
git commit -m "refactor: PostgresDocumentRepository como clase instanciable"
git commit -m "docs(growth): marcar checklist fase 4"
```
