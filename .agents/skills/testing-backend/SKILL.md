---
name: testing-backend
description: "Patrones de testing para el backend Express con arquitectura hexagonal. Cubre Vitest, supertest, mocks de puertos, DB real con setup/teardown, y coverage. Usar al crear o completar tests en src/**/__tests__/."
---

# Testing Backend Skill

## Framework

- **Vitest** v4+ con `globals: true` (no importar `test`/`expect`)
- **supertest** para tests HTTP
- **@vitest/coverage-v8** para reportes de cobertura
- Tests junto al código: `__tests__/*.test.js`

## Patrones

### 1. Test de Use Case (capa application)

Mockear puertos como POJOs con `vi.fn()`:

```js
const { ChatUseCase } = require("../ChatUseCase");

test("intent reply devuelve texto directo", async () => {
  const mockLlm = {
    chatCompletion: vi.fn().mockResolvedValue('{"intent":"reply","text":"Hola!"}')
  };
  const useCase = new ChatUseCase(mockLlm, null, null, null);
  const result = await useCase.execute({ message: "hola" });
  expect(result.reply).toBe("Hola!");
});
```

### 2. Test de Adapter sin IO (capa infrastructure)

Para adapters que no llaman a redes/DB (NorthwindODataAdapter.getSchema, InMemoryChatContext):
- Require directo
- Testear estado/transformaciones, no efectos secundarios

### 3. Test de Adapter con HTTP (axios)

Usar `vi.mock("axios")` para evitar llamadas reales:

```js
vi.mock("axios");
const axios = require("axios");
const adapter = require("../LmStudioAdapter");

test("chatCompletion llama al endpoint correcto", async () => {
  axios.post.mockResolvedValue({ data: { choices: [{ message: { content: "respuesta" } }] } });
  const result = await adapter.chatCompletion([{ role: "user", content: "hola" }]);
  expect(result).toBe("respuesta");
});
```

### 4. Test de Adapter con DB real (PostgreSQL)

Requiere base de datos `chatbot_rag_test` con las mismas tablas que producción.

Usar `vitest.setup.js` con `globalSetup`/`globalTeardown`:

```js
// vitest.setup.js
import { execSync } from "child_process";
import { Pool } from "pg";

const TEST_DB_URL = process.env.DATABASE_URL_TEST || "postgresql://chatbot_user:chatbot_pass_2026@localhost:5432/chatbot_rag_test";

let pool;

export async function setup() {
  process.env.DATABASE_URL = TEST_DB_URL;
  pool = new Pool({ connectionString: TEST_DB_URL });
  const schema = execSync("type db\\schema.sql", { encoding: "utf-8" });
  await pool.query(schema);
}

export async function teardown() {
  if (pool) await pool.end();
}
```

En cada test, limpiar datos en `beforeEach`/`afterEach`:

```js
import pool from "../../../shared/adapters/outbound/postgres/pool";

beforeEach(async () => {
  await pool.query("TRUNCATE documents, document_chunks, faq CASCADE");
});
```

### 5. Test de rutas HTTP (supertest)

Usar `vi.mock()` sobre el container para aislar la ruta de la lógica real:

```js
vi.mock("../../src/features/chat/composition/chatContainer");
const request = require("supertest");
const app = require("../../server");
const { buildChatUseCase } = require("../../src/features/chat/composition/chatContainer");

test("POST /api/chat valido devuelve 200", async () => {
  buildChatUseCase.mockReturnValue({
    execute: vi.fn().mockResolvedValue({ reply: "respuesta" })
  });
  await request(app).post("/api/chat").send({ message: "hola" }).expect(200);
});
```

## DB test setup

1. Crear DB: `CREATE DATABASE chatbot_rag_test;`
2. El `vitest.setup.js` corre `db/schema.sql` contra ella en `globalSetup`
3. Cada suite limpia datos en `beforeEach` con `TRUNCATE ... CASCADE`
4. Usar `DATABASE_URL_TEST` en `.env.test` o fallback a `chatbot_rag_test`

## Coverage

Configuración en `vitest.config.js`:

```js
test: {
  include: ["src/**/__tests__/**/*.test.js"],
  globals: true,
  setupFiles: ["./vitest.setup.js"],
  coverage: {
    provider: "v8",
    include: ["src/**"],
    exclude: ["src/**/__tests__/**", "src/**/*.test.js"],
    reporter: ["text", "lcov", "html"]
  }
}
```

## Scripts en package.json

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```
