# Ejercicios — Fase 03: Express en Producción

```bash
git checkout master
git checkout -b growth/fase-03-express-produccion
```

---

## Ejercicio 1: Crear errores tipados

**Crear:** `backend/src/shared/errors.js`

Define 3 clases de error:

```javascript
class NotFoundError extends Error {
  constructor(message = "Recurso no encontrado") {
    super(message);
    this.name = "NotFoundError";
    this.statusCode = 404;
  }
}

class ValidationError extends Error {
  constructor(message = "Datos inválidos", details = []) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
    this.details = details;
  }
}

class ExternalServiceError extends Error {
  constructor(message = "Error en servicio externo", serviceName = "unknown") {
    super(message);
    this.name = "ExternalServiceError";
    this.statusCode = 503;
    this.serviceName = serviceName;
  }
}

module.exports = { NotFoundError, ValidationError, ExternalServiceError };
```

---

## Ejercicio 2: Crear asyncHandler wrapper

**Crear:** `backend/src/shared/adapters/inbound/http/asyncHandler.js`

```javascript
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { asyncHandler };
```

---

## Ejercicio 3: Agregar error middleware a server.js

**Modificar:** `backend/server.js`

Agregar al final, después de `app.use("/api/documents", documentsRouter)`:

```javascript
app.use((err, req, res, next) => {
  console.error("=== ERROR GLOBAL ===", err.message);
  if (err.stack) console.error(err.stack.split("\n").slice(0, 3).join("\n"));
  res.status(err.statusCode || 500).json({
    error: err.message || "Error interno del servidor"
  });
});
```

---

## Ejercicio 4: Refactorizar routes/chat.js

**Modificar:** `backend/routes/chat.js`

- Usar `asyncHandler`
- Mover validación de mensaje vacío del use case al router
- Los tests actualizados deben reflejar que el error 400 viene del router

```javascript
const { asyncHandler } = require("../src/shared/adapters/inbound/http/asyncHandler");

router.post("/", asyncHandler(async (req, res) => {
  if (!req.body.message || !req.body.message.trim()) {
    return res.status(400).json({ reply: "El mensaje no puede estar vacio." });
  }
  const result = await chatUseCase.execute(req.body);
  res.json(result);
}));
```

---

## Ejercicio 5: Refactorizar routes/documents.js

Mismo patrón: asyncHandler en todos los handlers, validación en el adapter.

---

## Ejercicio 6: Verificar

```bash
# Probar error middleware: enviar un request que rompa
curl -X POST http://localhost:3001/api/chat -H "Content-Type: application/json" -d '{sinFormatoValido}'

# Debe responder JSON, no HTML
```

---

## Commits

```bash
git commit -m "feat: agregar errores tipados (NotFound, Validation, ExternalService)"
git commit -m "feat: crear asyncHandler wrapper para rutas asincronas"
git commit -m "feat: agregar error middleware global en server.js"
git commit -m "refactor: mover validacion de mensaje vacio al router chat"
git commit -m "refactor: aplicar asyncHandler en routes/documents.js"
git commit -m "docs(growth): marcar checklist fase 3"
```
