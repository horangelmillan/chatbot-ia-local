# Issue 08: Formatos PDF y DOCX listados como soportados pero no implementados

## Prioridad: 🟠 Moderada

## Documentación afectada
- `docs/guides/rag-concept.md` — tabla "Formatos soportados" (líneas 133-142) y tabla de "Estado de Implementación" (línea 458)
- `docs/guides/backend-rules.md` — línea 57: "Soporta: Markdown (con frontmatter), JSON, TXT"
- `docs/technical/01_arquitectura.md` — línea 93: menciona `pdf-parse` y `mammoth` como dependencias del backend

## Qué dice la documentación
La tabla de formatos en `rag-concept.md`:

| Formato | Librería |
|---------|----------|
| PDF | pdf-parse |
| DOCX | mammoth |
| Markdown | remark |
| JSON | JSON.parse |

Sin embargo, la misma tabla de "Estado de Implementación" más abajo (línea 458) dice:

| Indexador (PDF, DOCX) | ❌ Pendiente |

Esto es autocontradictorio.

Además, `01_arquitectura.md` dice:
> Dependencias adicionales: `pg`, `pdf-parse`, `mammoth`

Y `backend-rules.md` correctamente lista solo MD/JSON/TXT.

## Qué hace realmente el código
El indexador (`backend/db/indexer.js`) solo tiene parsers para:

```js
parsers["md"]  = async function (filePath) { ... }
parsers["txt"] = parsers["md"];
parsers["json"] = async function (filePath) { ... }
```

No hay parsers para `pdf` ni `docx`. Las librerías `pdf-parse` y `mammoth` están en `package.json` como dependencias, pero nunca se importan ni se usan en ningún archivo del backend.

La librería `remark` mencionada en la tabla tampoco se usa — el parsing de Markdown es con `fs.readFileSync` + regex simple.

## Propuesta de corrección

### Opción A: Implementar parsers de PDF y DOCX
Usar `pdf-parse` y `mammoth` en `indexer.js`:

```js
parsers["pdf"] = async function (filePath) {
  const pdfParse = require("pdf-parse");
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text;
};

parsers["docx"] = async function (filePath) {
  const mammoth = require("mammoth");
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
};
```

### Opción B: Alinear documentación con la realidad
- Marcar claramente PDF/DOCX como "Pendiente" en la tabla de formatos
- Actualizar `01_arquitectura.md` para no listar `pdf-parse`/`mammoth` como dependencias activas
- Eliminar mención de `remark` (no se usa)

## Impacto del cambio

| Aspecto | Detalle |
|---------|---------|
| **Archivos a modificar** | Opción A: `backend/db/indexer.js`. Opción B: `docs/guides/rag-concept.md`, `docs/technical/01_arquitectura.md` |
| **Riesgo** | Opción A: medio (parseo de PDF puede fallar en documentos complejos). Opción B: bajo |
| **Dependencias** | `pdf-parse` y `mammoth` ya están en `package.json` |
| **Verificación** | Opción A: indexar PDF de prueba y verificar chunks en BD |
