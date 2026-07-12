# Estrategia de Testing

> Documento vivo — Julio 2026
> Define cómo testeamos, qué cubrimos y cómo aseguramos calidad a futuro.

## Pirámide de Testing del Proyecto

```
        ╱╲
       ╱  ╲          E2E (Playwright)
      ╱    ╲         Flujos críticos: envı́o de mensaje, búsqueda FAQ
     ╱      ╲
    ╱────────╲
   ╱          ╲      Integración (supertest + DB real + OPA5)
  ╱            ╲     Rutas HTTP, adapters DB, integración UI
 ╱              ╲
╱────────────────╲   Unit (Vitest + QUnit)
╱                  ╲ Use cases, adapters sin IO, controladores UI
```

| Capa | Framework | Qué cubre | Qué NO cubre |
|------|-----------|-----------|--------------|
| **Unit (backend)** | Vitest | Use cases con mocks, adapters sin IO (InMemoryChatContext, getSchema, calcTotal) | Lógica que requiere DB, HTTP real, sistema de archivos |
| **Unit (frontend)** | QUnit | Controladores, modelos, helpers, formateadores | Interacción real con el DOM, navegación, OData |
| **Integración (backend)** | Vitest + supertest | Rutas HTTP con containers mockeados, adapters DB real (PostgresDocumentRepository, PostgresDocumentIndexer), adapters HTTP mockeados (Northwind, LM Studio) | El stack completo con LM Studio real |
| **Integración (frontend)** | OPA5 | Flujos de UI con mock fetch, visibilidad de vistas y controles | Backend real, datos reales |
| **E2E** | Playwright | Flujo completo frontend + backend + DB real | Cobertura exhaustiva de casos borde |

---

## Convenciones para Escribir Tests

### Backend (Vitest)

```
src/**/__tests__/*.test.js
routes/**/__tests__/*.test.js
```

1. **Use cases** — Mockear puertos como POJOs con `vi.fn()`:
   ```js
   const mockLlm = { chatCompletion: vi.fn().mockResolvedValue('{"intent":"reply","text":"ok"}') };
   const useCase = new ChatUseCase(mockLlm, null, null, null);
   ```

2. **Adapters con HTTP** — Usar `vi.mock("axios")` o inyección de dependencia:
   ```js
   vi.mock("axios");
   const axios = require("axios");
   axios.post.mockResolvedValue({ data: { choices: [...] } });
   ```

3. **Adapters con DB real** — Tests en suites separadas, limpiar datos en `beforeAll`:
   ```js
   beforeAll(async () => { await pool.query("TRUNCATE ... CASCADE"); });
   ```

4. **Rutas HTTP** — Mockear el container via `require.cache`:
   ```js
   require.cache[containerPath] = { ... };
   const request = require("supertest");
   const app = require("../../server");
   ```

5. **Archivos temporales** — Siempre con `try/finally`:
   ```js
   const tmpFile = path.resolve(__dirname, "__tmp__.md");
   fs.writeFileSync(tmpFile, content);
   try { /* test */ } finally { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); }
   ```

### Frontend (QUnit)

```
webapp/test/unit/**/*.js
webapp/test/integration/**/*.js
```

1. **Controladores** — Instanciar con `new`, mockear `getView`, destruir en `afterEach`
2. **Modelos/Helpers** — Tests directos de valor devuelto
3. **OPA5** — Page Objects con `waitFor` + assertions claras, mock fetch para backend

### E2E (Playwright)

```
e2e/specs/*.spec.js
```

1. Usar selectores estables (ids fijos, test ids) en vez de selectores auto-generados
2. Seed de datos en `beforeAll` via helpers
3. Timeouts generosos para SAPUI5 (20s+ para carga, 10s+ para respuestas)

---

## Checklist de "Definition of Done" para Testing

Una feature se considera completa solo cuando:

- [ ] **Use case nuevo**: test que cubre happy path + al menos un caso de error/edge
- [ ] **Adapter nuevo (sin IO)**: test que cubre todas las funciones públicas
- [ ] **Adapter nuevo (con HTTP)**: mock de axios + test de construcción de URL y manejo de respuesta/error
- [ ] **Adapter nuevo (con DB)**: test con DB real + test de caso sin datos
- [ ] **Ruta HTTP nueva**: test supertest con 200 + 400/404 + 500
- [ ] **Controlador UI nuevo**: test QUnit de init + acción principal + caso vacío/error
- [ ] **Feature cross-layer**: E2E test del flujo completo (opcional si hay tests de integración)
- [ ] **No baja cobertura general**: verificar con `pnpm test:backend:coverage`

---

## Visión de CI/CD (Futuro)

```yaml
# .github/workflows/test.yml — por implementar
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_DB: chatbot_rag_test, POSTGRES_USER: chatbot_user, POSTGRES_PASSWORD: chatbot_pass }
        options: --health-cmd pg_isready
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
      - run: pnpm install-all
      - run: pnpm test:backend
      - run: pnpm test:frontend
      - run: pnpm test:e2e
      - uses: codecov/codecov-action@v5
```

---

## Skills de Testing del Proyecto

El proyecto incluye 3 skills para asistentes de IA que trabajen en tests.
Estos skills están registrados en `AGENT.md` y deben cargarse según la tarea:

| Skill | Activación | Contenido |
|-------|-----------|-----------|
| `testing-backend` | Crear/ampliar tests en `backend/src/**/__tests__/` | Patrones Vitest + supertest + DB + mock de puertos |
| `testing-frontend` | Crear tests en `frontend/webapp/test/` | Patrones QUnit + OPA5 + mock server + page objects |
| `testing-e2e` | Crear tests end-to-end | Patrones Playwright + seed DB + flujo completo |

---

## Métricas Objetivo

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Cobertura backend (statements) | 84% | ≥85% |
| Cobertura backend (branches) | 62% | ≥75% |
| Cobertura frontend | No medida | ≥60% |
| Tests E2E de flujo crítico | 2 | ≥5 |
| Tiempo de ejecución backend | <10s | <30s (con más tests) |
| Tiempo de ejecución frontend | <15s | <30s |
| CI pipeline | No existe | Existente y verde |

---

## Referencias

- Skills de testing en `.agents/skills/testing-*/SKILL.md`
- Evaluación detallada actual: `docs/testing-evaluation.md`
- Documentación SAPUI5 Testing: https://sapui5.hana.ondemand.com/sdk/#/topic/7cdee404cac441888535ed7e22c833f2
- Vitest docs: https://vitest.dev/guide/
- Playwright docs: https://playwright.dev/docs/intro
