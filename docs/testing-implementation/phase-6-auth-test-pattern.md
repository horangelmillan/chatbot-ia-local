# Fase 6: Patrón de Tests de Autenticación (Preparación)

> Prioridad: 🔵 Media | Esfuerzo: 1h | Dependencias: Ninguna (tests en skip hasta implementar auth)

## Contexto

Actualmente las rutas del backend no tienen middleware de autenticación. Cuando se implemente (JWT, API key, session), debe haber un test ready que valide que las rutas rechazan requests sin token.

Esta fase NO implementa autenticación. Solo prepara el patrón de tests para que cuando llegue la feature, los tests ya estén escritos (en skip) y solo haya que activarlos.

## Diagnóstico

Las rutas actuales (`routes/chat.js`, `routes/documents.js`) no tienen middleware. Cualquier request puede acceder a todos los endpoints.

## Solución

### 1. Agregar tests en skip en `routes/__tests__/chat.test.js`

```js
describe.skip("Autenticacion", () => {
  test("POST /api/chat sin token devuelve 401", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send({ message: "hola" })
      .set("Authorization", "");
    expect(res.status).toBe(401);
  });

  test("GET /api/config sin token devuelve 401", async () => {
    const res = await request(app).get("/api/config");
    expect(res.status).toBe(401);
  });

  test("POST /api/chat con token valido devuelve 200", async () => {
    mockExecute.mockResolvedValue({ reply: "ok" });
    const res = await request(app)
      .post("/api/chat")
      .send({ message: "hola" })
      .set("Authorization", "Bearer valid-token");
    expect(res.status).toBe(200);
  });
});
```

### 2. Agregar tests en skip en `routes/__tests__/documents.test.js`

```js
describe.skip("Autenticacion", () => {
  test("POST /api/documents/index sin token devuelve 401", async () => {
    const res = await request(app)
      .post("/api/documents/index")
      .send({ path: "/test.md" });
    expect(res.status).toBe(401);
  });

  test("GET /api/documents/search sin token devuelve 401", async () => {
    const res = await request(app).get("/api/documents/search?q=test");
    expect(res.status).toBe(401);
  });
});
```

### 3. Helper de mock para middleware de auth

Crear en `routes/__tests__/helpers/auth.js`:

```js
// Mock para simular autenticacion en tests de rutas
// Activar cuando se implemente el middleware de auth.

function mockAuthMiddleware(req, res, next) {
  const token = req.headers.authorization;
  if (!token || !token.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.user = { id: "test-user" };
  next();
}

function mockAuthModule() {
  // Reemplazar el middleware real con el mock
  const authPath = require.resolve("../../middleware/auth");
  require.cache[authPath] = {
    id: authPath, filename: authPath, loaded: true,
    exports: mockAuthMiddleware
  };
}

module.exports = { mockAuthModule, mockAuthMiddleware };
```

## Archivos a modificar/crear

| Archivo | Acción |
|---------|--------|
| `backend/routes/__tests__/chat.test.js` | Agregar `describe.skip("Autenticacion", ...)` |
| `backend/routes/__tests__/documents.test.js` | Agregar `describe.skip("Autenticacion", ...)` |
| `backend/routes/__tests__/helpers/auth.js` | Crear — helper de mock de auth |

## Cómo activar cuando llegue la feature

1. Implementar middleware de auth en `backend/middleware/auth.js`
2. Agregar a las rutas: `router.use(require("../middleware/auth"))` o por endpoint
3. Cambiar `describe.skip` → `describe` en los tests
4. Verificar que los tests pasan

## Checklist

- [ ] Agregar `describe.skip("Autenticacion")` en routes/__tests__/chat.test.js
- [ ] Agregar tests: sin token → 401, con token válido → 200
- [ ] Agregar `describe.skip("Autenticacion")` en routes/__tests__/documents.test.js
- [ ] Agregar tests: sin token → 401
- [ ] Crear `routes/__tests__/helpers/auth.js` con mock
- [ ] Verificar: `pnpm test:backend` pasa (tests en skip no se ejecutan)
- [ ] Verificar: quitar skip localmente y verificar que fallan (no hay auth aún)

## Criterios de aceptación

- `pnpm test:backend` pasa con los tests en skip (no afectan ejecución)
- Los tests describen claramente el contrato esperado de auth (401 sin token, 200 con token)
- Cuando se implemente auth, solo hay que cambiar `skip` por ejecución normal
