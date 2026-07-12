# Guía Conceptual: Testing en Node.js

## 1. ¿Por qué testear?

El testing no es "algo que se hace después". Es una **herramienta de diseño**: cuando escribes un test, estás obligado a hacer tu código más modular, más inyectable, más predecible.

**Beneficio directo para ti**: cuando llegues a la Fase 05 (arquitectura DI), los tests te dirán si rompes algo.

## 2. Tipos de test que necesitas

| Tipo | Qué prueba | Ejemplo en tu proyecto |
|------|------------|------------------------|
| **Unitario** | Una clase/función aislada | ChatUseCase con LLM mockeado |
| **Integración** | Componentes reales (BD, API) | PostgresDocumentRepository con PostgreSQL real |
| **HTTP (API)** | Endpoints completos | POST /api/chat con supertest |

## 3. Arrange-Act-Assert

El patrón fundamental:

```javascript
// Arrange — preparar datos y mocks
const llm = { chatCompletion: async () => '{"intent":"reply","text":"hola"}' };
const useCase = new ChatUseCase(llm, null, null, null);

// Act — ejecutar
const result = await useCase.execute({ message: "hola" });

// Assert — verificar
expect(result.reply).toBe("hola");
```

## 4. Mocks vs Fakes vs Stubs

| Concepto | Definición | En tu proyecto |
|----------|------------|----------------|
| **Mock** | Objeto que registra cómo fue llamado | Verificar que `llm.chatCompletion` fue llamado con los argumentos correctos |
| **Stub** | Objeto que devuelve valores fijos | `llm.chatCompletion` devuelve siempre `{"intent":"reply","text":"ok"}` |
| **Fake** | Implementación simplificada | Un `InMemoryChatContext` de verdad (ya lo tienes) |

**Regla**: usa objetos planos (POJOs), no libraries de mocking complejas. Vitest tiene `vi.fn()` que es suficiente.

```javascript
// Mock simple sin bibliotecas externas
const mockLlm = {
  chatCompletion: vi.fn().mockResolvedValue('{"intent":"reply","text":"ok"}')
};
```

## 5. Vitest (recomendado)

Alternativa moderna a Jest. Es más rápida, compatible con ESM y CJS, y usa la misma API que Jest.

```bash
pnpm add -D vitest
```

## 6. Supertest para endpoints HTTP

Supertest levanta Express en un server temporal y hace requests sin ocupar un puerto real:

```javascript
const request = require("supertest");
const app = require("../server"); // tu app Express

const res = await request(app).post("/api/chat").send({ message: "hola" });
expect(res.status).toBe(200);
```

**Nota**: Tendrás que exportar `app` desde `server.js` (hoy solo hace `app.listen`).

## 7. Cobertura (coverage)

```bash
pnpm vitest --coverage
```

Te dice qué porcentaje del código está siendo ejecutado por los tests. **No obsesionarse con 100%**. Prioriza:

1. Lógica de orquestación (ChatUseCase — la más compleja)
2. Validaciones (¿qué pasa si el mensaje está vacío?)
3. Caminos de error (¿qué pasa si LM Studio devuelve 500?)

## 8. Estructura de tests

Convención: cada test junto al archivo que prueba, en carpeta `__tests__`:

```
src/features/chat/application/use-cases/
├── ChatUseCase.js
└── __tests__/
    └── ChatUseCase.test.js
```

Esto mantiene los tests cerca del código, visibles, fáciles de encontrar.
