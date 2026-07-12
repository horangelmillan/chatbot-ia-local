# Ejercicios — Fase 01: JavaScript Moderno

## Instrucciones

Cada ejercicio tiene un archivo de origen y una transformación específica. Haz commit después de cada archivo completado para tener trazabilidad fina.

```bash
git checkout -b growth/fase-01-javascript-moderno
# ... ejercicio 1 ...
git add backend/src/features/chat/application/use-cases/ChatUseCase.js
git commit -m "feat(es6): refactorizar ChatUseCase.js a ES6+"
# ... ejercicio 2 ...
# etc.
```

---

## Ejercicio 1: ChatUseCase.js (el más importante)

**Archivo:** `backend/src/features/chat/application/use-cases/ChatUseCase.js`

**Tareas:**

1. Cambiar todas las `var` por `const` (valores que no se reasignan) o `let` (acumuladores en bucles, variables que cambian)
2. Convertir las funciones constructoras a clase `class ChatUseCase { ... }`
3. Reemplazar `ChatUseCase.prototype.metodo = async function()` por métodos de clase
4. Cambiar concatenaciones con `+` a template literals:
   - `"Orden #" + o.OrderID` → `` `Orden #${o.OrderID}` ``
   - `"Cliente: " + c.CompanyName` → `` `Cliente: ${c.CompanyName}` ``
5. Usar destructuring en `execute`: `function execute(input)` → `execute({ message, history = [] })`
6. Reemplazar `forEach` con arrow functions donde sea posible (ya lo tienes en algunos lugares)
7. Cambiar `if (history && Array.isArray(history))` por optional chaining si aplica

**Ejemplo del antes/después esperado:**

```javascript
// ❌ Antes
var MAX_HISTORY = parseInt(process.env.CHAT_HISTORY_LIMIT, 10) || 6;
var DOC_CATEGORIES = ["Facturacion", "Proveedores", "Pagos", "General"];

function ChatUseCase(llm, odata, documentRepository, chatContext) {
  this.llm = llm;
  this.odata = odata;
  this.documentRepository = documentRepository;
  this.chatContext = chatContext;
}

ChatUseCase.prototype.execute = async function (input) {
  var message = input.message;
  var history = input.history || [];
  // ...
};

// ✅ Después
const MAX_HISTORY = parseInt(process.env.CHAT_HISTORY_LIMIT, 10) || 6;
const DOC_CATEGORIES = ["Facturacion", "Proveedores", "Pagos", "General"];

class ChatUseCase {
  constructor(llm, odata, documentRepository, chatContext) {
    this.llm = llm;
    this.odata = odata;
    this.documentRepository = documentRepository;
    this.chatContext = chatContext;
  }

  async execute({ message, history = [] }) {
    // ...
  }
}
```

**Criterio de éxito:** Al abrir el archivo, que no aparezca ni una `var`, ni una concatenación con `+`, ni un `function (args)` suelto.

---

## Ejercicio 2: Routes + Adapters del Chat

**Archivos:**
- `backend/routes/chat.js`
- `backend/src/features/chat/adapters/outbound/lmstudio/LmStudioAdapter.js`
- `backend/src/features/chat/adapters/outbound/northwind/NorthwindODataAdapter.js`
- `backend/src/features/chat/adapters/outbound/memory/InMemoryChatContext.js`

**Tareas:**

1. **routes/chat.js**: 
   - `var router`, `var chatUseCase` → `const`
   - `async function (req, res)` → `async (req, res)`
   - Extraer `message` y `history` con destructuring de `req.body`

2. **LmStudioAdapter.js**:
   - `var model` → `const model`
   - `async function chatCompletion` → `const chatCompletion = async (...) => {...}`
   - Template literal para la URL si es relevante

3. **NorthwindODataAdapter.js**:
   - Todas las `var` a `const`/`let`
   - `NUMERIC_FIELDS.indexOf(f.field) >= 0` → `NUMERIC_FIELDS.includes(f.field)`
   - `function (e)` en `getSchemaDescription` → arrow function
   - `function (s)` en `calcTotal` y `findSimilarOrders` → arrow function

4. **InMemoryChatContext.js**:
   - `var context = null` → `let context = null` (porque se reasigna)

**Criterio de éxito:** Ningún `var` en estos 4 archivos. Todos los callbacks en arrow functions.

---

## Ejercicio 3: Documentos (repositories + containers)

**Archivos:**
- `backend/src/features/documents/adapters/outbound/postgres/PostgresDocumentIndexer.js`
- `backend/src/features/documents/adapters/outbound/postgres/PostgresDocumentRepository.js`
- `backend/src/features/documents/composition/documentsContainer.js`
- `backend/shared/adapters/outbound/postgres/pool.js`

**Tareas:**

1. **PostgresDocumentIndexer.js**:
   - `var parsers = {}` → `const parsers = {}`
   - `parsers["md"] = async function` → `const mdParser = async (filePath) => {...}`
   - En `parseFrontmatter`: `var meta`, `var body`, `var end` → `let` las que mutan, `const` las que no
   - En `splitChunks`: `var lines`, `var chunks`, `var current` → `const`/`let` apropiados
   - Template literals en SQL strings (aunque las queries paramétricas usan placeholders, los strings alrededor sí pueden mejorar)

2. **PostgresDocumentRepository.js**:
   - `var sql`, `var params`, `var parts` → `let` SQL (porque se construye dinámicamente), `const` params array
   - Template literals para concatenación de SQL dinámico

3. **documentsContainer.js + pool.js**: Cambiar `var` por `const`

**Criterio de éxito:** Mismo que ejercicios anteriores — código moderno y consistente.

---

## Ejercicio 4: server.js + documents.js + frontend

**Archivos:**
- `backend/server.js`
- `backend/routes/documents.js`
- `frontend/webapp/controller/App.controller.js`

**Tareas:**

1. **server.js**: 
   - Cambiar `app.get("/api/config", function (req, res)` a arrow function
   - `const app`, `const PORT`

2. **documents.js**:
   - Arrow functions en todos los handlers
   - `var filePath`, `var directory`, `var result` → `const`/`let` apropiados
   - Destructuring de `req.body` y `req.query`

3. **App.controller.js** (frontend — el más desafiante por SAPUI5):
   - Cambiar `var that = this` por arrow functions (el `this` léxico lo resuelve)
   - Reemplazar `.then()` por `async/await` donde sea práctico
   - Cambiar `var` por `const`/`let` en variables locales
   - **Cuidado**: SAPUI5 runza en navegadores viejos (IE11 no). OpenUI5 1.150 requiere Chromium-based. ES6+ es seguro.

**Ejemplo App.controller.js:**

```javascript
// ❌ Antes
_loadConfig: function () {
  var that = this;
  fetch("http://localhost:3001/api/config")
    .then(function (oRes) { return oRes.json(); })
    .then(function (oData) {
      if (oData.chatHistoryLimit) that._maxHistory = oData.chatHistoryLimit;
    }).catch(function () { });
},

// ✅ Después
async _loadConfig() {
  try {
    const oRes = await fetch("http://localhost:3001/api/config");
    const oData = await oRes.json();
    if (oData?.chatHistoryLimit) this._maxHistory = oData.chatHistoryLimit;
  } catch {
    // Error silencioso — el default 6 funciona
  }
},
```

---

## Ejercicio 5: Autorevisión global

```bash
# Buscar todas las var en el proyecto (excluyendo node_modules)
rg --no-heading "var " --include "*.js" | grep -v node_modules
```

**Meta:** Que este comando devuelva 0 resultados.

**Excepciones justificadas:**
- Código generado por SAPUI5 (`sap.ui.define` callback — la firma la da el framework)
- `"use strict"` (no es variable, es directiva)
- Si encuentras algún caso donde `var` sea necesario por hoisting (raro), documéntalo con un comentario `// var necesario por hoisting — no refactorizar`

---

## Resumen de commits recomendados

```bash
git commit -m "feat(es6): refactorizar ChatUseCase.js a clase y ES6+"
git commit -m "feat(es6): actualizar routes/chat.js con destructuring y arrow functions"
git commit -m "feat(es6): modernizar LmStudioAdapter y NorthwindODataAdapter"
git commit -m "feat(es6): actualizar InMemoryChatContext"
git commit -m "feat(es6): refactorizar PostgresDocumentIndexer y PostgresDocumentRepository"
git commit -m "feat(es6): actualizar composition containers y pool"
git commit -m "feat(es6): modernizar server.js y routes/documents.js"
git commit -m "feat(es6): refactorizar App.controller.js a async/await y arrow functions"
git commit -m "docs(growth): marcar checklist fase 1 completo"
```
