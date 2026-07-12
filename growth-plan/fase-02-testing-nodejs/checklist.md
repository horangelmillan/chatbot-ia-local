# Checklist — Fase 02: Testing en Node.js

## Setup

- [ ] Crear rama: `git checkout -b growth/fase-02-testing-nodejs`
- [ ] Instalar vitest: `pnpm add -D vitest`
- [ ] Agregar script `"test": "vitest run"` en `backend/package.json`
- [ ] Leer guía completa
- [ ] Leer ejercicios completa

## Ejercicio 1: Exportar app

- [ ] Agregar `if (process.env.NODE_ENV !== "test")` en server.js
- [ ] Agregar `module.exports = app`
- [ ] Commit

## Ejercicio 2: Test InMemoryChatContext

- [ ] Crear carpeta `__tests__` junto al archivo
- [ ] Test: get() devuelve null al inicio
- [ ] Test: set + get funciona
- [ ] Test: reset limpia
- [ ] Commit

## Ejercicio 3: Test NorthwindODataAdapter

- [ ] Test: getSchema() tiene 3 entidades
- [ ] Test: cada entidad tiene filters, expand, maxTop
- [ ] Test: getSchemaDescription contiene nombres
- [ ] Commit

## Ejercicio 4: Test ChatUseCase (el más importante)

- [ ] Test: mensaje vacío → error
- [ ] Test: intent reply → texto directo
- [ ] Test: intent query → OData + generateReply
- [ ] Test: intent document_query → repositorio + type document
- [ ] Test: intent unknown → fuera de alcance
- [ ] Test: continuation sin contexto → error
- [ ] Commit

## Ejercicio 5: Test HTTP

- [ ] Instalar supertest
- [ ] Test: POST /api/chat vacío → 400
- [ ] Test: POST /api/chat válido → 200
- [ ] Commit

## Ejercicio 6: Verificar

- [ ] `pnpm test` corre y pasa todos los tests
- [ ] `pnpm test:watch` funciona (modo watch)
- [ ] Mergear a master sin borrar rama

## Reflexión post-fase

- [ ] Escribir 3 cosas que aprendí
- [ ] Escribir qué me costó más
- [ ] Escribir 1 cosa que haría diferente

## Progreso

```
[          ] 0%  — No empezado
[##        ] 20% — Setup + server export + test simple
[####      ] 40% — InMemoryChatContext + NorthwindAdapter
[######    ] 60% — ChatUseCase tests completos
[########  ] 80% — Supertest endpoint tests
[##########] 100% — Todos los tests pasan, mergeado
```

Fecha de inicio: _______________
Fecha de finalización: _______________
