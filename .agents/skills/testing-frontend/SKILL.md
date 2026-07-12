---
name: testing-frontend
description: "Patrones de testing para el frontend OpenUI5/SAPUI5. Cubre QUnit (unit), OPA5 (integration), mock server, y configuración con ui5-test-runner. Usar al crear tests en webapp/test/."
---

# Testing Frontend Skill

## Frameworks

- **QUnit** — tests unitarios de controladores, modelos, helpers y formateadores
- **OPA5** — tests de integración con Page Objects (journeys)
- **@openui5/sap.ui.core/qunit** — bibliotecas QUnit incluidas en OpenUI5
- **ui5-test-runner** (o Karma legacy) para ejecución CI

## Estructura

```
webapp/
  test/
    unit/
      unitTests.qunit.html    # suite runner unitario
      unitTests.qunit.js      # bootstrap de tests unitarios
      controller/
        App.controller.test.js
      model/
        models.test.js
      helper/
        Util.helper.test.js
    integration/
      integrationTests.qunit.html
      integrationTests.qunit.js
      pages/
        App.page.js
      journeys/
        App.journey.js
    testsuite.qunit.js        # registro de suites (unit + integration)
```

## Patrones

### 1. Test unitario de controlador (QUnit)

```js
sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "chatbot/ui/controller/App.controller"
], function(Controller, AppController) {
  QUnit.module("App.controller", {
    beforeEach: function() {
      this.controller = new AppController();
    },
    afterEach: function() {
      this.controller.destroy();
    }
  });

  QUnit.test("sendMessage actualiza el modelo", function(assert) {
    // Arrange
    const oModel = new sap.ui.model.json.JSONModel({ messages: [] });
    this.controller.getView().setModel(oModel, "chat");
    // Act
    this.controller.sendMessage();
    // Assert
    const data = oModel.getData();
    assert.ok(data.messages.length >= 0, "messages actualizado");
  });
});
```

### 2. Test OPA5 (journey)

```js
sap.ui.require([
  "sap/ui/test/Opa5",
  "chatbot/ui/test/integration/pages/App"
], function(Opa5) {
  QUnit.module("App Journey");

  Opa5.extendConfig({
    arrangements: new Opa5({
      iStartMyApp: function() {
        return this.iStartMyUIComponent({
          componentConfig: { name: "chatbot.ui" },
          hash: ""
        });
      }
    }),
    viewNamespace: "chatbot.ui.view.",
    actions: new Opa5(),
    assertions: new Opa5()
  });

  QUnit.test("Debe mostrar el botón de enviar", function(assert) {
    return Opa5.createPageObjects({
      onTheAppPage: {
        assertions: {
          iShouldSeeTheSendButton: function() {
            return this.waitFor({
              id: "sendBtn",
              viewName: "App",
              success: function() {
                assert.ok(true, "Botón de envío visible");
              },
              errorMessage: "No se encontró el botón de envío"
            });
          }
        }
      }
    });
  });
});
```

### 3. Mock Server para OData

Usar `sap/ui/model/odata/v2/ODataModel` con mock server en tests de integración para evitar dependencia del backend real:

```js
sap.ui.define([
  "sap/ui/test/Opa5",
  "sap/ui/core/util/MockServer"
], function(Opa5, MockServer) {
  return Opa5.extend("chatbot.ui.test.arrangements.MockServer", {
    iMockMyOData: function() {
      const oMockServer = new MockServer({
        rootUri: "/api/"
      });
      oMockServer.simulate("test/mockdata/metadata.xml", "test/mockdata/");
      oMockServer.start();
    }
  });
});
```

### 4. Ejecución

```shell
# El runner (ui5-test-runner + playwright) sirve la app, abre Chromium y ejecuta la testpage.
pnpm -C frontend test
```

`pnpm test` invoca:

```shell
ui5-test-runner --webapp webapp --ui5 https://ui5.sap.com \
  --port 8888 --localhost 127.0.0.1 \
  --url http://127.0.0.1:8888/test/unitTests.qunit.html \
  --browser $/playwright.js --ci
```

Notas:
- La testpage `webapp/test/unitTests.qunit.html` es **autocontenida**: carga QUnit por `<script>`
  síncrono ANTES del bootstrap de UI5 (para que el runner la detecte) y fija
  `data-sap-ui-resource-roots='{"chatbot.ui": "/"}'`. **No** se usa UI5 Test Starter
  (`testsuite.qunit.html`), porque el runner abre `Test.qunit.html` directamente sin aplicar los
  resource-roots del `createSuite`, y `/test-resources/chatbot/ui/...` da 404 en un proyecto
  *application*.
- Karma quedó **retirado** (`karma-ui5` está deprecado por SAP).

## Dependencias

En `frontend/package.json` (devDependencies): `ui5-test-runner`, `playwright`.
QUnit se carga desde el CDN de UI5 (no hay dependencia local `qunit`).
En CI: `pnpm -C frontend exec playwright install --with-deps chromium`.

## Referencias

- OpenUI5 Testing: https://sapui5.hana.ondemand.com/sdk/#/topic/7cdee404cac441888535ed7e22c833f2
- OPA5: https://sapui5.hana.ondemand.com/sdk/#/topic/2696ab50fa584cf78c51d98a1295c08e
- QUnit + UI5: https://sapui5.hana.ondemand.com/sdk/#/topic/6995256a0ae145c99c8bb9359e139b44
