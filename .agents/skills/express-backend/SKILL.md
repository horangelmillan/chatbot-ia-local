---
name: express-backend
description: "Express 4 inbound adapter patterns for hexagonal architecture using CommonJS. Route organization, async error handling, validation, middleware, and wiring with use cases. Use when creating or refactoring HTTP endpoints in this project's Node.js backend."
---

# Express Backend — Inbound Adapters for Hexagonal Architecture

This project uses **Express 4** with **CommonJS** (`require`/`module.exports`). HTTP handlers are **inbound adapters** — they translate HTTP requests into use-case calls and map results back to responses.

## Core Patterns

### Async Handler Wrapper

Every async route must catch errors and forward them to Express error middleware:

```javascript
// src/shared/adapters/inbound/http/asyncHandler.js
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { asyncHandler };
```

### Router Module (Inbound Adapter)

A router imports the use case, builds input from `req`, calls `execute`, and maps the result to `res.json`:

```javascript
// src/features/orders/adapters/inbound/http/orderRoutes.js
const { Router } = require("express");
const { asyncHandler } = require("../../../../shared/adapters/inbound/http/asyncHandler");
const { buildGetOrderUseCase } = require("../../../composition/ordersContainer");

const router = Router();
const getOrderUseCase = buildGetOrderUseCase();

router.get("/:id", asyncHandler(async (req, res) => {
  const result = await getOrderUseCase.execute({ orderId: req.params.id });
  if (!result) return res.status(404).json({ error: "Not found" });
  res.json(result);
}));

router.post("/", asyncHandler(async (req, res) => {
  const { customerId, items } = req.body;
  const result = await createOrderUseCase.execute({ customerId, items });
  res.status(201).json(result);
}));

module.exports = router;
```

### Input Validation at the Boundary

Validate at the adapter level before the use case is called. Keep validation schemas with the adapter, not in the domain:

```javascript
function validateCreateOrder(body) {
  const errors = [];
  if (!body.customerId) errors.push("customerId is required");
  if (!Array.isArray(body.items) || body.items.length === 0)
    errors.push("items must be a non-empty array");
  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}

router.post("/", asyncHandler(async (req, res) => {
  const check = validateCreateOrder(req.body);
  if (!check.valid) return res.status(400).json({ errors: check.errors });
  // ...proceed to use case
}));
```

### Error Middleware (Last in Chain)

Centralized error handler registered after all routes:

```javascript
// server.js
app.use("/api/orders", orderRoutes);

// Error handler — must be last, must have 4 params
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err.message);
  res.status(err.statusCode || 500).json({
    error: err.message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
  });
});

// 404 catch-all
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});
```

### Application Error Classes

Use typed errors in the application layer so the inbound adapter can map them to HTTP statuses:

```javascript
// src/shared/errors.js
class NotFoundError extends Error {
  constructor(message = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
    this.statusCode = 404;
  }
}

class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
    this.details = details;
  }
}

module.exports = { NotFoundError, ValidationError };
```

Then in the adapter:

```javascript
router.get("/:id", asyncHandler(async (req, res, next) => {
  try {
    const result = await getOrderUseCase.execute({ orderId: req.params.id });
    res.json(result);
  } catch (err) {
    if (err.name === "NotFoundError") return res.status(404).json({ error: err.message });
    if (err.name === "ValidationError") return res.status(400).json({ error: err.message, details: err.details });
    next(err); // unknown → error middleware
  }
}));
```

## Project Layout for Inbound Adapters

```
src/
  features/
    <feature>/
      adapters/
        inbound/
          http/
            <name>Routes.js     ← this file
```

## Related Skills

- **hexagonal-architecture** — abstract port/adapter theory, use-case design, migration playbook
- **node-pg-repository** — outbound adapter patterns for PostgreSQL (inject into use cases consumed by these routes)

## References

- `backend/server.js` — existing composition root and Express setup
- `backend/routes/chat.js` — existing route, will be refactored into adapters
