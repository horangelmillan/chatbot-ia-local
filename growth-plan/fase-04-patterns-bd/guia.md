# Guía: Patrones de Base de Datos

## 1. Transacciones con pg

```javascript
const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query("DELETE FROM documents WHERE id = $1", [id]);
  await client.query("INSERT INTO documents (...) VALUES (...)", [values]);
  await client.query("COMMIT");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
}
```

## 2. Repositorio instanciable

Hoy: `PostgresDocumentRepository.js` exporta funciones sueltas que usan `pool` global.

Después: clase que recibe `pool` en el constructor.

```javascript
class PostgresDocumentRepository {
  constructor(pool) {
    this.pool = pool;
  }
  async search(category, keywords) {
    await this.pool.query(...);
  }
}
```

Esto permite pasar un pool mock en los tests.
