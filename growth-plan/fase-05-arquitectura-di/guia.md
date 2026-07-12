# Guía: Arquitectura Hexagonal Real

## 1. Composition Root real

Hoy: `chatContainer.js` llama a `require()` directo y exporta funciones que devuelven el singleton.

```javascript
// ❌ Hoy — no es inyectable
function buildChatUseCase() {
  return new ChatUseCase(llmAdapter, odataAdapter, buildDocumentRepository(), chatContext);
}
```

Después: el composition root recibe las dependencias de afuera.

```javascript
// ✅ Composition root recibe dependencias
function buildChatUseCase(deps) {
  return new ChatUseCase(deps.llm, deps.odata, deps.documentRepository, deps.chatContext);
}

// Uso en server.js (o un main container):
const useCase = buildChatUseCase({
  llm: llmAdapter,
  odata: odataAdapter,
  documentRepository: buildDocumentRepository({ pool }),
  chatContext: chatContext
});
```

## 2. InMemoryChatContext por sesión

Hoy es una variable global compartida. Para producción necesita ser un Map.

```javascript
class InMemoryChatContext {
  constructor() {
    this.contexts = new Map();
  }
  get(sessionId) { return this.contexts.get(sessionId) ?? null; }
  set(sessionId, value) { this.contexts.set(sessionId, value); }
  reset(sessionId) { this.contexts.delete(sessionId); }
}
```

## 3. Puertos verificables

Hoy son archivos JSDoc vacíos. Opciones:
- **TypeScript**: ideal pero requiere migración mayor
- **JSDoc con `@implements`**: documentación que IDE puede verificar
- **Test de contrato**: test que verifica que el adapter implementa los métodos del puerto
