# Ejercicios — Fase 07: SAPUI5 Avanzado

```bash
git checkout master
git checkout -b growth/fase-07-sapui5-avanzado
```

## Ejercicio 1: OPA5 journey básico

Crear `frontend/webapp/test/integration/ChatJourney.js`:

1. Iniciar app
2. Escribir mensaje "hola"
3. Presionar Enviar
4. Verificar que aparece burbuja del asistente

## Ejercicio 2: Fragmentar la vista

Extraer `messageList`, `footer` y `welcomeButtons` en fragments.

## Ejercicio 3: Optimizar manifest.json

Agregar `"preload": false` para controladores grandes, configurar `sap.ui5/resources`.

## Ejercicio 4: ESLint para frontend

Agregar ESLint con globals de SAPUI5 y correrlo.

## Commits

```bash
git commit -m "test: OPA5 journey de envio de mensaje"
git commit -m "refactor: fragmentar vista en MessageListItem, ChatFooter"
git commit -m "perf: lazy loading de controladores en manifest.json"
git commit -m "config: ESLint para frontend SAPUI5"
git commit -m "docs(growth): marcar checklist fase 7"
```
