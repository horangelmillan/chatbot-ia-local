# Fase 06: Producción Real

## Objetivo

Implementar las funcionalidades que ya están documentadas pero no existen en código: caché, cola de LLM, Docker, hardening.

## Componentes

| Componente | Status hoy | Lo que hay que hacer |
|------------|-----------|---------------------|
| Caché con TTL | Solo documentado en `04_cache_y_escalabilidad.md` | Implementar Map con expiración |
| Cola de requests LLM | LM Studio procesa 1 request a la vez | Cola FIFO en backend |
| ESLint | No existe | `pnpm add -D eslint` + config |
| Docker | No existe | Dockerfile + docker-compose |
| README de setup | No existe | Desde clonar hasta tener el chat funcionando |
| Rate limiting | No existe | express-rate-limit |

## Tiempo: ~2 semanas
