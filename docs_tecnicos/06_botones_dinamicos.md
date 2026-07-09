# Botones Dinámicos por IA

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

- `_buttonsDisabled: boolean` — true después del primer click
- `_selectedButtonIndex: number` — índice del botón clickeado

Se actualizan vía `setProperty` con el path del contexto (`/items/N`) antes de enviar el mensaje.

## Flujo completo

```
Usuario: "quiero consultar un cliente"
 → LLM reply + buttons: [Cancelar]
 → Botón activo (azul)

Usuario: "12345"
 → LLM query + buttons: [Sí] [No]
 → Botones activos (azules)

Usuario clickea [Sí]
 → Botón [Sí] → verde (Accept)
 → Botón [No] → gris (Default, disabled)
 → Aparece bubble "sí, quiero consultar otro cliente"
 → Chatbot procesa y responde con nuevos datos + botones
```

## Archivos modificados

- `backend/routes/chat.js` — prompt del LLM + pase de `buttons` en respuesta
- `frontend/webapp/controller/App.controller.js` — renderizado y estado de botones
- `frontend/webapp/css/style.css` — margen para botones en burbujas
