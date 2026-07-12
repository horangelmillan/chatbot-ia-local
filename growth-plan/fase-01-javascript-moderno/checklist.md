# Checklist — Fase 01: JavaScript Moderno

## Preparación

- [ ] Crear rama: `git checkout -b growth/fase-01-javascript-moderno`
- [ ] Leer `guia.md` completa
- [ ] Leer `ejercicios.md` completa

## Ejercicio 1: ChatUseCase.js

- [x] `var` → `const`/`let` en todas las variables
- [x] `function ChatUseCase()` → `class ChatUseCase`
- [x] `ChatUseCase.prototype.*` → métodos de clase
- [x] Template literals en lugar de concatenación con `+`
- [x] Destructuring en `execute`: `({ message, history = [] })`
- [x] Arrow functions en todos los callbacks internos
- [x] `includes()` en lugar de `indexOf() >= 0`
- [x] Commit: `feat(es6): refactorizar ChatUseCase.js a clase y ES6+`

## Ejercicio 2: Routes + Adapters del Chat

### routes/chat.js
- [x] `var` → `const` en router, chatUseCase
- [x] Arrow functions en handlers
- [x] Destructuring de `req.body`
- [x] Commit: `feat(es6): actualizar routes/chat.js`

### LmStudioAdapter.js
- [x] `var` → `const`
- [x] Arrow functions
- [x] Commit incluido con routes

### NorthwindODataAdapter.js
- [x] `var` → `const`/`let`
- [x] `indexOf` → `includes`
- [x] Arrow functions en todos los callbacks
- [x] Commit: `feat(es6): modernizar NorthwindODataAdapter`

### InMemoryChatContext.js
- [x] `var context = null` → `let context = null`
- [x] Arrow functions en exports
- [x] Commit incluido con Northwind

## Ejercicio 3: Documentos

### PostgresDocumentIndexer.js
- [x] `var` → `const`/`let`
- [x] Arrow functions en `parsers`
- [x] Template literals donde aplique
- [x] `includes()` en lugar de `indexOf() >= 0`
- [x] Commit: `feat(es6): refactorizar PostgresDocumentIndexer`

### PostgresDocumentRepository.js
- [x] `var` → `const`/`let`
- [x] Arrow functions en callbacks
- [x] Template literals para SQL dinámico
- [x] Commit: `feat(es6): refactorizar PostgresDocumentRepository`

### documentsContainer.js + pool.js
- [x] `var` → `const`
- [x] Commit incluido

## Ejercicio 4: server.js + documents.js + frontend

### server.js
- [x] `var` → `const`
- [x] Arrow functions
- [x] Commit incluido

### routes/documents.js
- [x] `var` → `const`/`let`
- [x] Arrow functions en handlers
- [x] Destructuring de `req.body` y `req.query`
- [x] Commit: `feat(es6): modernizar server.js y routes/documents.js`

### App.controller.js (frontend)
- [x] `var` → `const`/`let`
- [x] `var that = this` eliminado (usar arrow functions)
- [x] `.then()` → `async/await`
- [x] Template literals
- [x] Commit: `feat(es6): refactorizar App.controller.js`

## Verificación final

- [x] Ejecutar búsqueda de `var` y verificar que no haya resultados en archivos refactorizados
- [x] Iniciar backend y verificar que carga sin errores
- [ ] Mergear a master
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
