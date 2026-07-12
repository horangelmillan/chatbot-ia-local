# Fase 05: Arquitectura Hexagonal Real (DI + Puertos)

## Objetivo

Convertir la arquitectura hexagonal de "fachada documentada" a implementación real. Esto significa:

1. Composition root que acepta dependencias (no singletons ocultos)
2. Puertos que se puedan verificar en tiempo de desarrollo
3. ChatUseCase totalmente inyectable para testing
4. InMemoryChatContext session-aware (no global)

## ¿Por qué es importante?

Hoy el hexagonal es documentación bonita pero el código sigue acoplado. `chatContainer.js` no es un composition root real — es un re-exportador de singletons.

## Archivos a modificar/crear

- `backend/src/features/chat/composition/chatContainer.js`
- `backend/src/features/chat/adapters/outbound/memory/InMemoryChatContext.js`
- `backend/routes/chat.js`
- `backend/src/features/documents/composition/documentsContainer.js`

## Tiempo: ~3 semanas
