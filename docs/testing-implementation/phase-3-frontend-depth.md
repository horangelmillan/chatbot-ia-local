# Fase 3: Frontend — Tests de profundidad + Base.controller

> Prioridad: 🟡 Alta | Esfuerzo: 2-3h | Dependencias: Ninguna

## Contexto

El frontend tiene 15 tests pero varios son trivials:
- `Util.helper.js`: solo verifica que `showBusy` y `hideBusy` son funciones (sin probar que funcionan)
- `WelcomeOptions.js`: solo verifica que devuelve un array con label/message
- `models.js`: solo verifica que `createMessagesModel` devuelve un JSONModel

Además, `Base.controller.js` (15 líneas) con el método `showMessage` que tiene un branch (`sType === "error"`) no tiene ningún test.

## Diagnóstico

| Archivo fuente | Líneas | ¿Tests reales? |
|---------------|--------|----------------|
| `webapp/base/Base.controller.js` | 15 (1 método, 1 branch) | ❌ Ninguno |
| `webapp/helper/Util.helper.js` | 13 (2 funciones) | ⚠️ Solo verifica existencia |
| `webapp/config/WelcomeOptions.js` | 12 (1 array) | ⚠️ Solo verifica estructura |
| `webapp/model/models.js` | 10 (1 factory) | ⚠️ Solo verifica tipo devuelto |

## Solución

### 1. Tests para `Base.controller.js`

Crear `frontend/webapp/test/unit/base/Base.controller.js`:

```js
sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "chatbot/ui/base/Base.controller"
], function (Controller, BaseController) {
  "use strict";

  QUnit.module("Base.controller", {
    beforeEach: function () {
      this.oController = new BaseController();
    },
    afterEach: function () {
      this.oController.destroy();
    }
  });

  QUnit.test("showMessage con tipo normal usa MessageToast sin duracion", function (assert) {
    var done = assert.async();
    sap.m.MessageToast.show = function (sText, oOptions) {
      assert.strictEqual(sText, "Mensaje normal");
      assert.strictEqual(oOptions, undefined, "sin opciones extra");
      done();
    };
    this.oController.showMessage("Mensaje normal");
  });

  QUnit.test("showMessage con tipo error usa MessageToast con duracion 4000", function (assert) {
    var done = assert.async();
    sap.m.MessageToast.show = function (sText, oOptions) {
      assert.strictEqual(sText, "Error message");
      assert.strictEqual(oOptions.duration, 4000, "duracion 4000ms");
      done();
    };
    this.oController.showMessage("Error message", "error");
  });
});
```

### 2. Tests reales para `Util.helper`

Reemplazar `test/unit/helper/Util.helper.js`:

```js
sap.ui.define([
  "sap/ui/core/BusyIndicator",
  "chatbot/ui/helper/Util.helper"
], function (BusyIndicator, Util) {
  "use strict";

  QUnit.module("Util.helper");

  QUnit.test("showBusy llama a BusyIndicator.show", function (assert) {
    var orig = BusyIndicator.show;
    var bCalled = false;
    BusyIndicator.show = function () { bCalled = true; };
    Util.showBusy();
    assert.ok(bCalled, "BusyIndicator.show fue llamado");
    BusyIndicator.show = orig;
  });

  QUnit.test("hideBusy llama a BusyIndicator.hide", function (assert) {
    var orig = BusyIndicator.hide;
    var bCalled = false;
    BusyIndicator.hide = function () { bCalled = true; };
    Util.hideBusy();
    assert.ok(bCalled, "BusyIndicator.hide fue llamado");
    BusyIndicator.hide = orig;
  });
});
```

### 3. Tests reales para `WelcomeOptions`

Reemplazar `test/unit/config/WelcomeOptions.js` con validación de contenido real:

```js
sap.ui.define(["chatbot/ui/config/WelcomeOptions"], function (Options) {
  "use strict";

  QUnit.module("WelcomeOptions");

  QUnit.test("devuelve un array con opciones", function (assert) {
    assert.ok(Array.isArray(Options));
    assert.ok(Options.length >= 2, "al menos 2 opciones");
  });

  QUnit.test("cada opcion tiene label y message no vacios", function (assert) {
    Options.forEach(function (o) {
      assert.ok(typeof o.label === "string" && o.label.length > 0, "label no vacio");
      assert.ok(typeof o.message === "string" && o.message.length > 0, "message no vacio");
    });
  });

  QUnit.test("las opciones tienen estructura consistente", function (assert) {
    Options.forEach(function (o) {
      assert.ok(o.hasOwnProperty("label"), "tiene label");
      assert.ok(o.hasOwnProperty("message"), "tiene message");
      assert.strictEqual(Object.keys(o).length, 2, "solo label y message");
    });
  });
});
```

### 4. Medición de cobertura frontend (opcional en esta fase)

Dependiendo de si se usa Karma o se migra a `ui5-test-runner`, instalar:

```bash
# Si se queda en Karma:
cd frontend && pnpm add -D karma-coverage

# En karma.conf.js agregar:
config.set({
  reporters: ["progress", "coverage"],
  coverageReporter: {
    type: "text",
    dir: "coverage/"
  }
});
```

## Archivos a modificar/crear

| Archivo | Acción |
|---------|--------|
| `frontend/webapp/test/unit/base/Base.controller.js` | Crear — tests para `showMessage` con ambos branches |
| `frontend/webapp/test/unit/helper/Util.helper.js` | Reemplazar — tests reales con spy en BusyIndicator |
| `frontend/webapp/test/unit/config/WelcomeOptions.js` | Reemplazar — tests de validación de datos |
| `frontend/webapp/test/testsuite.qunit.js` | Agregar entrada para `Base.controller` |
| `frontend/karma.conf.js` | Agregar `karma-coverage` (opcional) |

## Checklist

- [ ] Crear test para `Base.controller.showMessage` con tipo normal
- [ ] Crear test para `Base.controller.showMessage` con tipo error
- [ ] Reemplazar test de `Util.helper` con spy en `BusyIndicator`
- [ ] Reemplazar test de `WelcomeOptions` con validación de contenido
- [ ] Registrar `Base.controller` en `testsuite.qunit.js`
- [ ] Verificar: `cd frontend && pnpm test` pasa

## Criterios de aceptación

- `cd frontend && pnpm test` pasa con los tests reemplazados (no solo los viejos eliminados)
- `Base.controller.showMessage` cubre ambos branches (normal y error)
- Los tests de `Util.helper` verifican comportamiento real (llamadas a BusyIndicator), no solo existencia de funciones
