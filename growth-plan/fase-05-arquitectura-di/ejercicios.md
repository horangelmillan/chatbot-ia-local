# Ejercicios — Fase 05: Arquitectura Hexagonal Real

```bash
git checkout master
git checkout -b growth/fase-05-arquitectura-di
```

## Ejercicio 1: Composition root real

Refactorizar `chatContainer.js` para recibir dependencias como parámetro.

Luego actualizar `routes/chat.js` para pasar las dependencias desde server.js o crear un contenedor principal.

## Ejercicio 2: InMemoryChatContext session-aware

Refactorizar a clase con `Map<sessionId, Context>`. Documentar en `ChatContextPort.js` este comportamiento.

Actualizar `ChatUseCase.execute()` para recibir `sessionId`.

Actualizar frontend para enviar `X-Session-ID` (un UUID generado al iniciar la app).

## Ejercicio 3: Tests actualizados

Los tests de ChatUseCase (Fase 02) deben funcionar sin cambios porque usan mocks.

## Commits

```bash
git commit -m "refactor: chatContainer recibe dependencias como parametro"
git commit -m "feat: InMemoryChatContext con Map por sessionId"
git commit -m "feat: frontend envia X-Session-ID en cada request"
git commit -m "test: verificar que ChatUseCase sigue funcionando"
git commit -m "docs(growth): marcar checklist fase 5"
```
