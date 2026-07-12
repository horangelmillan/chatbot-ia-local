# Guía: Express en Producción

## 1. Error middleware

Express permite un middleware especial con 4 parámetros que captura errores de cualquier ruta:

```javascript
// Debe ir DESPUÉS de todas las rutas
app.use((err, req, res, next) => {
  console.error("Error no manejado:", err.message);
  res.status(err.statusCode || 500).json({
    error: err.message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
  });
});
```

## 2. asyncHandler wrapper

Cada ruta asíncrona necesita try/catch. El wrapper elimina la repetición:

```javascript
// asyncHandler.js
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Uso en ruta
router.post("/", asyncHandler(async (req, res) => {
  // si esto lanza error, asyncHandler lo pasa al error middleware
  const result = await useCase.execute(req.body);
  res.json(result);
}));
```

## 3. Errores tipados

Lanzar errores con status code explícito:

```javascript
class NotFoundError extends Error {
  constructor(message = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
    this.statusCode = 404;
  }
}
```

El error middleware usa `err.statusCode` automáticamente.

## 4. Validación en el adapter

La validación de entrada (¿el mensaje está vacío? ¿tiene los campos requeridos?) pertenece al adapter HTTP, no al use case:

```javascript
// ❌ Hoy: ChatUseCase valida
async execute({ message }) {
  if (!message || !message.trim()) {
    return { reply: "El mensaje no puede estar vacio." };
  }
}

// ✅ Después: router valida, use case siempre recibe datos válidos
router.post("/", asyncHandler(async (req, res) => {
  if (!req.body.message || !req.body.message.trim()) {
    return res.status(400).json({ reply: "El mensaje no puede estar vacio." });
  }
  const result = await chatUseCase.execute(req.body);
  res.json(result);
}));
```
