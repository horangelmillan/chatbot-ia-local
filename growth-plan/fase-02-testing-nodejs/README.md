# Fase 02: Testing en Node.js

## Objetivo

Agregar pruebas automatizadas al backend del proyecto. Pasar de cero tests a tener tests que cubran los caminos críticos: la lógica de `ChatUseCase` (la orquestación más compleja), los adapters, y los endpoints HTTP.

## ¿Por qué es importante?

- **Sin tests, no sabes si funciona.** Cada refactorización (como la de la Fase 01) puede romper algo sin que te des cuenta.
- **Sin tests, no puedes refactorizar con confianza.** La Fase 05 (arquitectura DI) requiere mover código — si no hay tests, es adivinar.
- **Sin tests, el proyecto no es profesional.** Es el primer filtro en cualquier revisión técnica seria.

## Conceptos a dominar

| Concepto | Por qué |
|----------|---------|
| Mocks, stubs, fakes | Para testear `ChatUseCase` sin llamar a LM Studio ni Northwind |
| Supertest | Para testear endpoints HTTP sin levantar el servidor real |
| Vitest (o Jest) | Framework de testing — aserciones, describe/it, setup/teardown |
| Arrange-Act-Assert | Patrón fundamental de cualquier test |
| Cobertura (coverage) | Para saber qué no estás testeando |

## Tiempo estimado

| Actividad | Tiempo |
|-----------|--------|
| Configurar Vitest en el proyecto | 30 min |
| Test: InMemoryChatContext (el más fácil) | 1 hora |
| Test: NorthwindODataAdapter.getSchema() | 1 hora |
| Test: ChatUseCase.execute() con mocks | 1 semana |
| Test: supertest sobre POST /api/chat | 2-3 días |
| Test: PostgresDocumentRepository | 2-3 días |
| **Total** | **~4 semanas** |

## Archivos a crear

- `backend/vitest.config.js` — configuración de Vitest
- `backend/src/features/chat/adapters/outbound/memory/__tests__/InMemoryChatContext.test.js`
- `backend/src/features/chat/adapters/outbound/northwind/__tests__/NorthwindODataAdapter.test.js`
- `backend/src/features/chat/application/use-cases/__tests__/ChatUseCase.test.js`
- `backend/src/features/documents/adapters/outbound/postgres/__tests__/PostgresDocumentRepository.test.js`
- `backend/routes/__tests__/chat.test.js`

## Criterio de éxito

```
> pnpm test

ChatUseCase
  ✓ should return error for empty message
  ✓ should call decideAction and generateReply for query intent
  ✓ should return document content for document_query intent
  ✓ should return continuation context if available

HTTP
  ✓ POST /api/chat should return 400 for empty message
  ✓ POST /api/chat should return 200 for valid message

Tests: 6 passed
```
