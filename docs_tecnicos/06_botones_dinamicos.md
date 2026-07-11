# Botones Dinámicos y Opciones de Bienvenida

## Objetivo

El LLM puede sugerir botones de acción en sus respuestas para guiar al usuario sin romper el flujo conversacional.

## Esquema de respuesta del backend

El endpoint `POST /api/chat` ahora puede devolver `buttons` además de `reply`:

```json
{
  "reply": "Deseas consultar otro cliente?",
  "buttons": [
    { "label": "Sí", "message": "sí, quiero consultar otro cliente" },
    { "label": "No", "message": "no, terminemos" }
  ]
}
```

- `label`: texto visible en el botón
- `message`: mensaje que se envía al backend cuando el usuario clickea

## Cómo el LLM decide los botones

En `decideAction` (backend), el system prompt incluye:

```
Si toca ofrecer opciones al usuario, agrega buttons a reply o query:
{"intent":"reply","text":"...","buttons":[{"label":"Sí","message":"sí quiero seguir"}]}
```

El LLM puede emitir `buttons` tanto en `intent: "reply"` como en `intent: "query"`. El backend los pasa al frontend intactos.

## Frontend: renderizado

### `App.controller.js`

| Método | Responsabilidad |
|--------|----------------|
| `_createButtonRow(sPath, aButtons, bDisabled, iSelectedIndex)` | Crea un array de controles `sap.m.Button` con estado visual y handler |
| `itemFactory(sId, oContext)` | Si el mensaje asistente tiene `buttons`, los agrega al VBox |

### Estados visuales del botón

| Estado | `type` SAPUI5 | Descripción |
|--------|---------------|-------------|
| Activo (no clickeado) | `Emphasized` | Azul, invita a clickear |
| Seleccionado (clickeado) | `Accept` | Verde, indica cuál escogió |
| Deshabilitado (no seleccionado) | `Default` | Gris, ya no se puede interactuar |

### Control de estado

Cada mensaje en el modelo tiene dos propiedades efímeras:

- `_buttonsDisabled: boolean` — true después del primer click **o** cuando el usuario envía un nuevo mensaje sin clickear
- `_selectedButtonIndex: number` — índice del botón clickeado

Se actualizan vía `setProperty` con el path del contexto (`/items/N`) antes de enviar el mensaje.

### Auto-deshabilitado al enviar mensaje

Cuando el usuario envía cualquier mensaje (ya sea clickeando un botón o escribiendo),
el método `onSend()` itera todos los mensajes y deshabilita cualquier botón que aún
esté activo:

```javascript
var aItems = this._messagesModel.getProperty("/items");
for (var i = 0; i < aItems.length; i++) {
    if (aItems[i].buttons && !aItems[i]._buttonsDisabled) {
        this._messagesModel.setProperty("/items/" + i + "/_buttonsDisabled", true);
    }
}
```

Esto evita que el usuario clickee una opción de un mensaje anterior y rompa el
flujo conversacional. La deshabilitación ocurre **antes** de agregar el mensaje
del usuario al modelo y llamar al backend.

### Casos contemplados

| Escenario | Comportamiento |
|-----------|---------------|
| Usuario clickea un botón | Ese botón se deshabilita en el click handler; `onSend()` deshabilita los botones de otros mensajes activos |
| Usuario escribe y envía | `onSend()` deshabilita todos los botones de todos los mensajes activos |
| Usuario clickea botón de bienvenida | Igual que cualquier botón — se deshabilitan los de bienvenida y cualquier otro activo |

## Flujo completo

```
Usuario: "quiero consultar un cliente"
 → LLM reply + buttons: [Cancelar]
 → Botón activo (azul)

Usuario: "12345"  (escribe, no clickea [Cancelar])
 → Botón [Cancelar] → gris (Default, disabled)  ← auto-deshabilitado
 → LLM query + buttons: [Sí] [No]
 → Botones activos (azules)

Usuario clickea [Sí]
 → Botón [Sí] → verde (Accept)
 → Botón [No] → gris (Default, disabled)
 → Botón [Cancelar] ya estaba gris
 → Aparece bubble "sí, quiero consultar otro cliente"
 → Chatbot procesa y responde con nuevos datos + botones
```

## Opciones estáticas de bienvenida

Además de los botones generados por el LLM, existe un conjunto de opciones estáticas
en el primer mensaje de bienvenida.

**Origen:** `frontend/webapp/config/WelcomeOptions.js`

**Flujo:**
1. `onInit()` o `onNewSession()` → `_showWelcome()` → `_addMessage("Asistente", texto, WelcomeOptions)`
2. El array de `WelcomeOptions` se pasa como `aButtons`, reutilizando el mismo renderizado de `_createButtonRow`
3. No hay diferencia técnica: los botónes estáticos se comportan igual que los dinámicos del LLM

**Extensibilidad:** para agregar una opción, solo se añade un objeto al array exportado por `WelcomeOptions.js`.
El controller no se modifica. Si las opciones superan ~6, migrar a `sap.m.Select` / `SelectDialog`.

## Archivos modificados

- `backend/routes/chat.js` — prompt del LLM + pase de `buttons` en respuesta
- `frontend/webapp/controller/App.controller.js` — renderizado, estado de botones, auto-deshabilitado en `onSend()`, `_showWelcome()`
- `frontend/webapp/config/WelcomeOptions.js` — opciones estáticas de bienvenida
- `frontend/webapp/css/style.css` — margen para botones en burbujas
