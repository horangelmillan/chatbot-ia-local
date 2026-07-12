# Fase 5: CI Pipeline — GitHub Actions

> Prioridad: 🟡 Alta | Esfuerzo: 2-3h | Dependencias: Fase 4 (tests limpios)

## Contexto

No existe ningún pipeline de CI. Los tests solo se ejecutan localmente. Esto significa:
- No hay verificación automática en pull requests
- No hay gatekeeping de calidad antes de mergear
- No hay reportes de cobertura históricos
- No hay ejecución nocturna de E2E

## Diagnóstico

```bash
ls .github/
# .github: No existe
```

## Solución

### 1. Workflow de PR/push (`test.yml`)

Crear `.github/workflows/test.yml`:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-backend:
    name: Backend tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: chatbot_rag_test
          POSTGRES_USER: chatbot_user
          POSTGRES_PASSWORD: chatbot_pass_2026
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install -C backend
      - run: pnpm -C backend test:coverage
        env:
          DATABASE_URL_TEST: postgresql://chatbot_user:chatbot_pass_2026@localhost:5432/chatbot_rag_test
      - uses: codecov/codecov-action@v5
        with:
          directory: backend/coverage
          flags: backend

  test-frontend:
    name: Frontend tests
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test

  lint:
    name: Lint check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Lint check - no linter configured yet"
```

### 2. Workflow nocturno (`nightly.yml`)

Crear `.github/workflows/nightly.yml`:

```yaml
name: Nightly
on:
  schedule:
    - cron: '0 6 * * *'  # 6 AM UTC daily
  workflow_dispatch:

jobs:
  test-all:
    name: Full test suite (incl. E2E)
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: chatbot_rag_test
          POSTGRES_USER: chatbot_user
          POSTGRES_PASSWORD: chatbot_pass_2026
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - name: Install all
        run: |
          pnpm install -C backend
          pnpm install -C frontend
          pnpm install -C e2e
      - name: Backend tests
        run: pnpm -C backend test:coverage
        env:
          DATABASE_URL_TEST: postgresql://chatbot_user:chatbot_pass_2026@localhost:5432/chatbot_rag_test
      - name: Frontend tests
        run: pnpm -C frontend test
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
        working-directory: e2e
      - name: E2E tests
        run: pnpm test
        working-directory: e2e
        env:
          DATABASE_URL_TEST: postgresql://chatbot_user:chatbot_pass_2026@localhost:5432/chatbot_rag_test
      - uses: codecov/codecov-action@v5
        with:
          directory: backend/coverage
          flags: backend
```

### 3. Secretos de CI

Configurar en GitHub Secrets del repositorio:

| Secret | Valor |
|--------|-------|
| `DATABASE_URL_TEST` | `postgresql://chatbot_user:...` |
| `LM_STUDIO_URL` | (si aplica, para E2E con LLM real) |

### 4. Verificación local del workflow (opcional)

```bash
# Instalar act para probar workflows localmente
winget install act  # o: pnpm add -g @nektos/act
act -j test-backend
```

## Archivos a crear

| Archivo | Acción |
|---------|--------|
| `.github/workflows/test.yml` | Crear — CI para push/PR |
| `.github/workflows/nightly.yml` | Crear — CI nocturna con E2E |

## Riesgos

- **PostgreSQL service**: el health check puede fallar si la imagen tarda en arrancar. Los `--health-retries 5` deberían ser suficientes.
- **E2E en nightly**: requiere backend + frontend + DB funcionando. Si el frontend no compila, el workflow falla.
- **Cobertura**: codecov/codecov-action requiere token. Si no se configura, simplemente no sube reporte (no rompe el workflow).

## Checklist

- [ ] Crear `.github/workflows/test.yml` con jobs backend + frontend
- [ ] Crear `.github/workflows/nightly.yml` con full suite + E2E
- [ ] Verificar que `DATABASE_URL_TEST` funciona sin hardcode (usar secret/env)
- [ ] Verificar: los workflows se ven en GitHub Actions > pestaña Actions
- [ ] Verificar: un PR muestra el status check de CI

## Criterios de aceptación

- Los workflows aparecen en GitHub Actions del repositorio
- Un push a main dispara el workflow `CI`
- Todos los jobs pasan (backend, frontend, lint)
- El reporte de cobertura se sube a Codecov (si configurado)
- El workflow nightly se ejecuta en el horario programado
