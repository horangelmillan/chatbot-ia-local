# Checklist — Fase 01: JavaScript Moderno

## Preparación

- [ ] Crear rama: `git checkout -b growth/fase-01-javascript-moderno`
- [ ] Leer `guia.md` completa
- [ ] Leer `ejercicios.md` completa

## Ejercicio 1: ChatUseCase.js

- [ ] `var` → `const`/`let` en todas las variables
- [ ] `function ChatUseCase()` → `class ChatUseCase`
- [ ] `ChatUseCase.prototype.*` → métodos de clase
- [ ] Template literals en lugar de concatenación con `+`
- [ ] Destructuring en `execute`: `({ message, history = [] })`
- [ ] Arrow functions en todos los callbacks internos
- [ ] `includes()` en lugar de `indexOf() >= 0`
- [ ] Commit: `feat(es6): refactorizar ChatUseCase.js a clase y ES6+`

## Ejercicio 2: Routes + Adapters del Chat

### routes/chat.js
- [ ] `var` → `const` en router, chatUseCase
- [ ] Arrow functions en handlers
- [ ] Destructuring de `req.body`
- [ ] Commit: `feat(es6): actualizar routes/chat.js`

### LmStudioAdapter.js
- [ ] `var` → `const`
- [ ] Arrow functions
- [ ] Commit incluido con routes

### NorthwindODataAdapter.js
- [ ] `var` → `const`/`let`
- [ ] `indexOf` → `includes`
- [ ] Arrow functions en todos los callbacks
- [ ] Commit: `feat(es6): modernizar NorthwindODataAdapter`

### InMemoryChatContext.js
- [ ] `var context = null` → `let context = null`
- [ ] Arrow functions en exports
- [ ] Commit incluido con Northwind

## Ejercicio 3: Documentos

### PostgresDocumentIndexer.js
- [ ] `var` → `const`/`let`
- [ ] Arrow functions en `parsers`
- [ ] Template literals donde aplique
- [ ] `includes()` en lugar de `indexOf() >= 0`
- [ ] Commit: `feat(es6): refactorizar PostgresDocumentIndexer`

### PostgresDocumentRepository.js
- [ ] `var` → `const`/`let`
- [ ] Arrow functions en callbacks
- [ ] Template literals para SQL dinámico
- [ ] Commit: `feat(es6): refactorizar PostgresDocumentRepository`

### documentsContainer.js + pool.js
- [ ] `var` → `const`
- [ ] Commit incluido

## Ejercicio 4: server.js + documents.js + frontend

### server.js
- [ ] `var` → `const`
- [ ] Arrow functions
- [ ] Commit incluido

### routes/documents.js
- [ ] `var` → `const`/`let`
- [ ] Arrow functions en handlers
- [ ] Destructuring de `req.body` y `req.query`
- [ ] Commit: `feat(es6): modernizar server.js y routes/documents.js`

### App.controller.js (frontend)
- [ ] `var` → `const`/`let`
- [ ] `var that = this` eliminado (usar arrow functions)
- [ ] `.then()` → `async/await`
- [ ] Template literals
- [ ] Commit: `feat(es6): refactorizar App.controller.js`

## Verificación final

- [ ] Ejecutar `rg --no-heading "var " --include "*.js"` y verificar que no haya resultados en `backend/` y `frontend/webapp/`
- [ ] Iniciar backend: `pnpm run dev:backend` y verificar que no hay errores de sintaxis
- [ ] Iniciar frontend: `pnpm run dev:frontend` y verificar que carga
- [ ] Hacer un POST de prueba a `/api/chat` y verificar que responde
- [ ] Mergear a master: `git checkout master && git merge growth/fase-01-javascript-moderno`
- [ ] **NO borrar la rama**

## Reflexión post-fase

- [ ] Escribir 3 cosas que aprendí en esta fase
- [ ] Escribir 1 cosa que me resultó difícil
- [ ] Escribir 1 cosa que haría diferente la próxima vez

---

## Progreso

```
[          ] 0%  — No empezado
[##        ] 20% — ChatUseCase.js completo
[####      ] 40% — Routes + adapters completos
[######    ] 60% — Documentos completos
[########  ] 80% — Frontend completo
[##########] 100% — Verificado y mergeado a master
```

Fecha de inicio: _______________
Fecha de finalización: _______________
