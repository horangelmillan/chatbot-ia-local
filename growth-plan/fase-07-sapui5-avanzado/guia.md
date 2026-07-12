# Guía: SAPUI5 Avanzado

## 1. OPA5 Testing

OPA5 (One Page Acceptance) es el framework de tests de integración de SAPUI5. Simula interacciones de usuario:

```javascript
opaTest("Deberia enviar mensaje y ver respuesta", function (Given, When, Then) {
  Given.iStartMyAppInAFrame("index.html");
  When.iType("Hola")["and"].iPress("Enviar");
  Then.iShouldSee("Asistente");
});
```

## 2. Fragmentación

En lugar de una sola vista, dividir en fragments reutilizables:

- `MessageListItem.fragment.xml` — template de cada burbuja
- `WelcomeButtons.fragment.xml` — botones de bienvenida
- `ChatFooter.fragment.xml` — toolbar con input

## 3. Lazy Loading

En manifest.json:

```json
"sap.ui5": {
  "resources": {
    "js": [{ "uri": "controller/App.controller.js", "preload": false }]
  }
}
```

## 4. ESLint para SAPUI5

```json
{
  "globals": { "sap": "readonly" }
}
```
