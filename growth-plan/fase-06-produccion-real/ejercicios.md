# Ejercicios — Fase 06: Producción Real

```bash
git checkout master
git checkout -b growth/fase-06-produccion-real
```

## Ejercicio 1: Caché con TTL

Crear `backend/src/shared/cache/TtlCache.js` e integrarlo en el flujo de consultas a Northwind y búsqueda documental.

## Ejercicio 2: Cola de LLM

Crear `backend/src/shared/queue/LlmQueue.js`. Integrar en `LmStudioAdapter` para que todas las llamadas a `chatCompletion` pasen por la cola.

## Ejercicio 3: ESLint

```bash
pnpm add -D eslint
pnpm eslint --init
# Elegir: CommonJS, Node, JSON, no React
# Configurar rules básicas
pnpm eslint src/ routes/
```

## Ejercicio 4: Dockerfile + docker-compose

Crear `Dockerfile` y `docker-compose.yml` con backend + PostgreSQL.

## Ejercicio 5: README de setup

Crear `README.md` en la raíz del proyecto.

## Ejercicio 6: Rate limiting

```bash
pnpm add express-rate-limit
```

Agregar en server.js:

```javascript
const rateLimit = require("express-rate-limit");
app.use("/api/", rateLimit({ windowMs: 60000, max: 30 }));
```

## Commits

```bash
git commit -m "feat: implementar TtlCache con expiracion automatica"
git commit -m "feat: implementar LlmQueue para serializar requests"
git commit -m "config: agregar ESLint con config basica"
git commit -m "infra: Dockerfile y docker-compose"
git commit -m "docs: README con instrucciones de setup"
git commit -m "feat: rate limiting en /api/"
git commit -m "docs(growth): marcar checklist fase 6"
```
