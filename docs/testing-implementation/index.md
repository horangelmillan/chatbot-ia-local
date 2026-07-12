# Plan de Implementación de Testing por Fases

> Documento vivo — Julio 2026
> Objetivo: llevar la cobertura y calidad de testing al 100% del código con lógica real.

## Roadmap

| Fase | Prioridad | Esfuerzo | Dependencias | Estado |
|------|-----------|----------|--------------|--------|
| **1 — ChatUseCase branches** | 🔴 Crítico | 2-3h | Ninguna | ✅ Completa |
| **2 — E2E flujos completos** | 🔴 Crítico | 3-4h | Fase 4 (opcional, para evitar noise en CI) | ✅ Completa |
| **3 — Frontend depth** | 🟡 Alta | 2-3h | Ninguna | ✅ Completa |
| **4 — Silent tests + console** | 🟡 Alta | 1-2h | Ninguna | ✅ Completa |
| **5 — CI pipeline** | 🟡 Alta | 2-3h | Fase 4 (tests deben ser silent en CI) | Pendiente |
| **6 — Auth test pattern** | 🔵 Media | 1h | Ninguna (tests en skip hasta implementar auth) | Pendiente |
| **7 — Migraciones técnicas** | 🔵 Media | 3-4h | Fase 1-6 completadas | Pendiente |

## Cobertura actual vs objetivo

| Métrica | Actual | Objetivo | Cómo se mide |
|---------|--------|----------|-------------|
| Cobertura backend (statements) | 91% | ≥90% | `pnpm test:backend:coverage` |
| Cobertura backend (branches) | 84% | ≥80% | `pnpm test:backend:coverage` |
| ChatUseCase branch coverage | 97% | 100% | `pnpm test:backend:coverage` |
| Cobertura frontend | No medida | ≥60% | `karma-coverage` o `ui5-test-runner` |
| E2E tests | 2 | ≥7 | `cd e2e && pnpm playwright test --list` |
| CI pipeline | No existe | Existe y verde | `gh run list` |

## Principios

1. **Cada fase es autocontenida**: se puede completar en una sesión independiente
2. **No romper tests existentes**: verificar con `pnpm test:backend` después de cada cambio
3. **Deuda técnica documentada**: si una fase descubre un problema, se documenta como `ponytail:` comment en el código o como issue en `docs/issues/`
4. **Progreso visible**: marcar checklist en cada fase al completar tareas

## Progreso global

- [x] Fase 1: ChatUseCase branches
- [x] Fase 2: E2E flujos completos
- [x] Fase 3: Frontend depth
- [x] Fase 4: Silent tests + console
- [ ] Fase 5: CI pipeline
- [ ] Fase 6: Auth test pattern
- [ ] Fase 7: Migraciones técnicas

---

**Siguiente:** [Fase 1 — ChatUseCase branches](./phase-1-chat-usecase.md)
