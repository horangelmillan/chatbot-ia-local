// Mock para simular autenticacion en tests de rutas.
// Activar cuando se implemente el middleware de auth (quitar describe.skip
// y llamar a mockAuthModule() desde los tests de autenticacion).

function mockAuthMiddleware(req, res, next) {
  const token = req.headers.authorization;
  if (!token || !token.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.user = { id: "test-user" };
  next();
}

function mockAuthModule() {
  // Reemplazar el middleware real con el mock en require.cache.
  const authPath = require.resolve("../../middleware/auth");
  require.cache[authPath] = {
    id: authPath,
    filename: authPath,
    loaded: true,
    exports: mockAuthMiddleware
  };
}

module.exports = { mockAuthModule, mockAuthMiddleware };
