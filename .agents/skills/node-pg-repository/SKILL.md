---
name: node-pg-repository
description: "PostgreSQL outbound adapter patterns for hexagonal architecture using node-postgres (pg) with CommonJS. Pool management, parameterized queries, transactions, and repository implementations. Use when creating or refactoring database access adapters in this project."
---

# Node-Postgres Repository — Outbound Adapters for Hexagonal Architecture

This project uses **pg** (`node-postgres`) with **CommonJS** via a shared connection pool. Database access code lives in **outbound adapters** that implement port interfaces used by the application layer.

## Core Patterns

### Pool Configuration

The pool is a singleton, shared across all repository adapters:

```javascript
// src/shared/adapters/outbound/postgres/pool.js
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000
});

pool.on("error", (err) => {
  console.error("PG pool error:", err.message);
});

module.exports = pool;
```

### Repository as Outbound Adapter

A repository implements a port interface. Each method uses `pool.query()` for single queries or `pool.connect()` for transactions:

```javascript
// src/features/documents/adapters/outbound/postgres/PostgresDocumentRepository.js
const pool = require("../../../../shared/adapters/outbound/postgres/pool");

// Port interface (for reference — in JS it's a convention, not a compile-time check)
// Expected methods: save(document), findById(id), search(category, keywords)

function PostgresDocumentRepository() {}

PostgresDocumentRepository.prototype.save = async function (document) {
  const result = await pool.query(
    "INSERT INTO documents (code, title, category, file_name, file_path, version, checksum) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id",
    [document.code, document.title, document.category, document.fileName, document.filePath, document.version, document.checksum]
  );
  return result.rows[0].id;
};

PostgresDocumentRepository.prototype.findById = async function (id) {
  const result = await pool.query(
    "SELECT * FROM documents WHERE id = $1 OR code = $1",
    [id]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
};

PostgresDocumentRepository.prototype.search = async function (category, keywords) {
  const tsquery = keywords.map(k => k.replace(/[^\w\s]/g, "") + ":*").join(" & ");
  let sql = "SELECT dc.id, dc.document_id, dc.chunk_number, dc.title, dc.content, d.code, d.category ";
  sql += "FROM document_chunks dc JOIN documents d ON d.id = dc.document_id ";
  sql += "WHERE to_tsvector('spanish', dc.content) @@ to_tsquery('spanish', $1)";
  const params = [tsquery];
  if (category) {
    params.push(category);
    sql += " AND d.category = $2";
  }
  sql += " ORDER BY ts_rank(to_tsvector('spanish', dc.content), to_tsquery('spanish', $1)) DESC LIMIT 1";
  const result = await pool.query(sql, params);
  return result.rows.length > 0 ? result.rows[0] : null;
};

PostgresDocumentRepository.prototype.findFAQ = async function (category, keywords) {
  let sql = "SELECT code, question, answer, category FROM faq WHERE (";
  const params = [];
  const parts = keywords.map((k, i) => {
    params.push(k);
    return `keywords @> ARRAY[$${i + 1}]`;
  });
  sql += parts.join(" OR ") + ")";
  if (category) {
    params.push(category);
    sql += ` AND category = $${params.length}`;
  }
  sql += " LIMIT 1";
  const result = await pool.query(sql, params);
  return result.rows.length > 0 ? result.rows[0] : null;
};

module.exports = { PostgresDocumentRepository };
```

### Parameterized Queries (SQL Injection Prevention)

Always use `$1, $2, ...` placeholders. Never concatenate user input into SQL:

```javascript
// ✅ Correct
await pool.query("SELECT * FROM users WHERE id = $1", [userId]);

// ❌ Wrong — SQL injection
await pool.query(`SELECT * FROM users WHERE id = '${userId}'`);
```

### Transactions

Use `pool.connect()` to get a dedicated client, then `BEGIN`/`COMMIT`/`ROLLBACK`:

```javascript
PostgresDocumentRepository.prototype.saveWithChunks = async function (document, chunks) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const docResult = await client.query(
      "INSERT INTO documents (code, title, category) VALUES ($1,$2,$3) RETURNING id",
      [document.code, document.title, document.category]
    );
    const docId = docResult.rows[0].id;
    for (let i = 0; i < chunks.length; i++) {
      await client.query(
        "INSERT INTO document_chunks (document_id, chunk_number, title, content, token_count) VALUES ($1,$2,$3,$4,$5)",
        [docId, i + 1, chunks[i].title, chunks[i].content, chunks[i].tokenCount]
      );
    }
    await client.query("COMMIT");
    return docId;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};
```

### Error Handling in Adapters

Translate database errors into application-level errors so the use case doesn't depend on pg:

```javascript
const { NotFoundError } = require("../../../../shared/errors");

PostgresDocumentRepository.prototype.findById = async function (id) {
  try {
    const result = await pool.query("SELECT * FROM documents WHERE id = $1", [id]);
    if (result.rows.length === 0) throw new NotFoundError(`Document ${id} not found`);
    return result.rows[0];
  } catch (err) {
    if (err.name === "NotFoundError") throw err;
    // Wrap unexpected DB errors
    throw new Error(`Database error: ${err.message}`);
  }
};
```

## Project Layout for Outbound Adapters

```
src/
  features/
    <feature>/
      adapters/
        outbound/
          postgres/
            <name>Repository.js   ← this file
  shared/
    adapters/
      outbound/
        postgres/
          pool.js                ← shared pool singleton
```

## Related Skills

- **hexagonal-architecture** — abstract port/adapter theory, repository port interfaces, migration playbook
- **express-backend** — inbound adapters that consume these repositories via use cases

## References

- `backend/db/pool.js` — existing pool configuration
- `backend/db/engine.js` — existing query logic, will be refactored into repositories
- `backend/db/schema.sql` — database schema for documents, chunks, and faq tables
