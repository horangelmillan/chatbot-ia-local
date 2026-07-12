# Guía Conceptual: JavaScript Moderno (ES6+)

## 1. `const` y `let` vs `var`

### El problema con `var`

`var` tiene **function scoping** (alcance de función), no **block scoping**. Esto causa bugs confusos:

```javascript
// ❌ var - NO USAR
function ejemplo() {
  if (true) {
    var x = 10;
  }
  console.log(x); // 10 — x "escapa" del bloque if
}

// ✅ let - block scoping
function ejemplo() {
  if (true) {
    let x = 10;
  }
  console.log(x); // ReferenceError: x is not defined
}
```

### Regla práctica

```javascript
const — valor que no se reasigna (por defecto, úsalo siempre)
let   — valor que se reasigna (contadores, acumuladores)
var   — no uses nunca (salvo que trabajes con código legacy que lo requiera)
```

### En tu proyecto

```javascript
// ❌ Ahora
var MAX_HISTORY = parseInt(process.env.CHAT_HISTORY_LIMIT, 10) || 6;
var DOC_CATEGORIES = ["Facturacion", "Proveedores", "Pagos", "General"];

// ✅ Después
const MAX_HISTORY = parseInt(process.env.CHAT_HISTORY_LIMIT, 10) || 6;
const DOC_CATEGORIES = ["Facturacion", "Proveedores", "Pagos", "General"];
```

---

## 2. Arrow functions

### Sintaxis

```javascript
// ❌ Function expression
function (a, b) {
  return a + b;
}

// ✅ Arrow function (una línea, return implícito)
(a, b) => a + b

// ✅ Arrow function (varias líneas)
(a, b) => {
  const resultado = a + b;
  return resultado;
}
```

### Ventajas clave

1. **Más concisa**: menos boilerplate
2. **Lexical `this`**: la arrow function no crea su propio `this`, hereda el del contexto padre

### En tu proyecto

```javascript
// ❌ Ahora (App.controller.js)
var that = this;
fetch(url).then(function (oRes) {
  return oRes.json();
}).then(function (oData) {
  that._addMessage("Asistente", oData.reply);
});

// ✅ Después
fetch(url)
  .then((oRes) => oRes.json())
  .then((oData) => this._addMessage("Asistente", oData.reply));
```

---

## 3. Template literals

### Sintaxis

```javascript
// ❌ Concatenación
"Orden #" + o.OrderID + " - Cliente: " + o.CustomerID

// ✅ Template literal
`Orden #${o.OrderID} - Cliente: ${o.CustomerID}`
```

### Ventajas

- Más legible
- Soporta multilínea sin `\n`
- Puedes meter expresiones: `${total.toFixed(2)}`

### En tu proyecto

```javascript
// ❌ Ahora (ChatUseCase.js)
return [
  "Facturacion - Orden #" + (order.OrderID || ""),
  "Total: $" + granTotal.toFixed(2),
].join("\n");

// ✅ Después
return [
  `Facturacion - Orden #${order.OrderID || ""}`,
  `Total: $${granTotal.toFixed(2)}`,
].join("\n");
```

---

## 4. Destructuring

### Sintaxis

```javascript
// ❌ Sin destructuring
function execute(input) {
  var message = input.message;
  var history = input.history || [];
}

// ✅ Con destructuring
function execute({ message, history = [] }) {
  // message y history ya están disponibles
}
```

### En tu proyecto

```javascript
// ❌ Ahora
router.post("/", async function (req, res) {
  try {
    var result = await chatUseCase.execute({ message: req.body.message, history: req.body.history });
    // ...
  }
});

// ✅ Después
router.post("/", async (req, res) => {
  try {
    const { message, history } = req.body;
    const result = await chatUseCase.execute({ message, history });
    // ...
  }
});
```

Nota: `{ message, history }` es azúcar sintáctico para `{ message: message, history: history }`.

---

## 5. Optional chaining (`?.`)

### Sintaxis

```javascript
// ❌ Sin optional chaining
var data = result && result.data && result.data.value;

// ✅ Con optional chaining
const data = result?.data?.value;
```

### En tu proyecto

```javascript
// ❌ Ahora
oData?.chatHistoryLimit

// ✅ Después
const limit = oData?.chatHistoryLimit;
```

---

## 6. Nullish coalescing (`??`)

### ¿Por qué no `||`?

```javascript
const limite = valor || 6;
// Si valor es 0, "" o false, limite será 6 — aunque 0 pueda ser un valor válido

const limite = valor ?? 6;
// Solo usa 6 si valor es null o undefined. 0, "" y false pasan.
```

### En tu proyecto

```javascript
// ❌ Ahora
var maxHistory = parseInt(process.env.CHAT_HISTORY_LIMIT, 10) || 6;

// ✅ Después (aunque parseInt ya devuelve NaN, no null — igual es más claro)
const maxHistory = parseInt(process.env.CHAT_HISTORY_LIMIT, 10) ?? 6;
```

---

## 7. Métodos de array modernos

| Método | Reemplaza | Cuándo usarlo |
|--------|-----------|---------------|
| `map` | `for` + push | Transformar cada elemento |
| `filter` | `for` + if + push | Quedarse con elementos que cumplen condición |
| `reduce` | `for` + acumulador | Reducir array a un valor (suma, objeto, etc.) |
| `find` | `for` + break + return | Encontrar primer elemento que cumple |
| `some` | `for` + flag boolean | Saber si ALGÚN elemento cumple |
| `every` | `for` + flag boolean | Saber si TODOS los elementos cumplen |

### En tu proyecto

```javascript
// ❌ Ahora (NorthwindODataAdapter.js)
var parts = filters.map(function (f) {
  var val = NUMERIC_FIELDS.indexOf(f.field) >= 0 ? Number(f.value) : "'" + f.value + "'";
  return f.field + " " + f.op + " " + val;
});

// ✅ Después
const parts = filters.map((f) => {
  const val = NUMERIC_FIELDS.includes(f.field) ? Number(f.value) : `'${f.value}'`;
  return `${f.field} ${f.op} ${val}`;
});
```

---

## 8. Clases (opcional, alternativa a prototipos)

```javascript
// ❌ Prototipos
function ChatUseCase(llm, odata, documentRepository, chatContext) {
  this.llm = llm;
  this.odata = odata;
  this.documentRepository = documentRepository;
  this.chatContext = chatContext;
}
ChatUseCase.prototype.execute = async function (input) {
  // ...
};

// ✅ Clase
class ChatUseCase {
  constructor(llm, odata, documentRepository, chatContext) {
    this.llm = llm;
    this.odata = odata;
    this.documentRepository = documentRepository;
    this.chatContext = chatContext;
  }

  async execute(input) {
    // ...
  }
}
```

**Nota**: esto es opcional en esta fase. Puedes mantener prototipos y solo cambiar `var`/`function`. Si te sientes cómodo, refactoriza a clase. Si no, déjalo para más adelante.

---

## 9. Async/await — consistencia

Ya usas `async/await` en la mayoría del backend. El frontend sigue usando `.then()`. Consistencia:

```javascript
// ❌ Frontend ahora
_callBackend: function (sMessage) {
  var that = this;
  fetch("http://localhost:3001/api/chat", { ... })
    .then(function (oRes) {
      if (!oRes.ok) return oRes.json().then(function (oErr) { throw new Error(oErr.reply); });
      return oRes.json();
    })
    .then(function (oData) { that._addMessage("Asistente", oData.reply); })
    .catch(function (oErr) { that._addMessage("Asistente", oErr.message); });
}

// ✅ Con async/await (SAPUI6+ soporta)
async _callBackend(sMessage) {
  try {
    const oRes = await fetch("http://localhost:3001/api/chat", { ... });
    if (!oRes.ok) {
      const oErr = await oRes.json();
      throw new Error(oErr.reply);
    }
    const oData = await oRes.json();
    this._addMessage("Asistente", oData.reply);
  } catch (oErr) {
    this._addMessage("Asistente", oErr.message);
  }
}
```

---

## Resumen visual del cambio

| Patrón legacy | Reemplazo moderno |
|---------------|-------------------|
| `var x = ...` | `const x = ...` o `let x = ...` |
| `function (a) { return a + 1; }` | `(a) => a + 1` |
| `"Hola " + nombre` | `` `Hola ${nombre}` `` |
| `var msg = obj.msg; var val = obj.val;` | `const { msg, val } = obj;` |
| `a && a.b && a.b.c` | `a?.b?.c` |
| `valor || default` | `valor ?? default` |
| `arr.indexOf(x) >= 0` | `arr.includes(x)` |
| `for (var i = 0; i < arr.length; i++)` | `arr.map()`, `arr.filter()`, `arr.reduce()` |
| `.then(function(r) { ... })` | `await` / `async` |
