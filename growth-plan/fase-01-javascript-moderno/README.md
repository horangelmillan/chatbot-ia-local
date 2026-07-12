# Fase 01: JavaScript Moderno (ES6+)

## Objetivo

Refactorizar todo el código backend del proyecto usando características modernas de JavaScript (ES6+) para eliminar patrones legacy (var, prototype, function expressions) que delatan código generado por IA sin revisión.

## ¿Por qué es importante?

El proyecto corre en Node.js 22, que soporta 100% de ES6+. Usar `var`, prototipos y `function(){}` en vez de `const`/`let`, clases y arrow functions no es "cuestión de estilo" — es:

- **Legibilidad**: el código legacy es más verboso y difícil de seguir
- **Seguridad**: `var` tiene function scoping, no block scoping — causa bugs sutiles
- **Mantenibilidad**: el código moderno expresa mejor la intención
- **Credibilidad profesional**: en una entrevista, el primer vistazo al código ya habla

## Conceptos a dominar

| Concepto | Nivel esperado al final |
|----------|------------------------|
| `const` y `let` (vs `var`) | Elegir conscientemente cuándo usar cada uno |
| Arrow functions | Refactorizar todos los callbacks |
| Template literals | Reemplazar toda concatenación con `+` |
| Destructuring (objetos y arrays) | Extraer propiedades en parámetros de función |
| Spread/rest operator | Copiar arrays,合并 objetos, argumentos variables |
| Optional chaining (`?.`) | Navegación segura en objetos anidados |
| Nullish coalescing (`??`) | Distinguir `null`/`undefined` de valores falsy |
| Async/await (ya lo usas parcialmente) | Consistencia en todo el código |
| Métodos de array modernos | `map`, `filter`, `reduce`, `find`, `some` vs bucles `for` |

## Tiempo estimado

| Actividad | Tiempo |
|-----------|--------|
| Leer guía conceptual | 1 hora |
| Ejercicio 1: ChatUseCase.js | 2-3 horas |
| Ejercicio 2: routes + adapters | 2-3 horas |
| Ejercicio 3: repositories + containers | 2-3 horas |
| Ejercicio 4: frontend (App.controller.js) | 2 horas |
| Autorevisión y checklist | 1 hora |
| **Total** | **~10-12 horas (~2 semanas)** |

## Archivos a modificar en esta fase

### Backend (prioridad alta)
- `backend/src/features/chat/application/use-cases/ChatUseCase.js`
- `backend/src/features/chat/adapters/outbound/lmstudio/LmStudioAdapter.js`
- `backend/src/features/chat/adapters/outbound/northwind/NorthwindODataAdapter.js`
- `backend/src/features/chat/adapters/outbound/memory/InMemoryChatContext.js`
- `backend/src/features/chat/composition/chatContainer.js`
- `backend/src/features/documents/adapters/outbound/postgres/PostgresDocumentIndexer.js`
- `backend/src/features/documents/adapters/outbound/postgres/PostgresDocumentRepository.js`
- `backend/src/features/documents/composition/documentsContainer.js`
- `backend/src/shared/adapters/outbound/postgres/pool.js`
- `backend/routes/chat.js`
- `backend/routes/documents.js`
- `backend/server.js`

### Frontend (prioridad media)
- `frontend/webapp/controller/App.controller.js`

## Criterio de éxito

Al final de esta fase, **ningún archivo del proyecto debe contener `var`** (salvo casos excepcionales justificados con comentario). Tampoco debe haber `function (args)` sin usar arrow functions donde tenga sentido.
