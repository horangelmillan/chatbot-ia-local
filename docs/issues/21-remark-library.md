# Issue 21: Librería "remark" listada en documentación pero no utilizada

## Prioridad: 🟠 Moderada

## Documentación afectada
- `docs/guides/rag-concept.md` — tabla "Formatos soportados" (línea 139)

## Qué dice la documentación
| Formato | Librería |
|---------|----------|
| Markdown | remark |

## Qué hace realmente el código
El parsing de Markdown en `indexer.js` (línea 8-9) es:

```js
parsers["md"] = async function (filePath) {
  return fs.readFileSync(filePath, "utf-8");
};
```

No se usa `remark` ni ninguna librería de parsing de Markdown. El contenido se lee como texto plano y se divide en chunks mediante expresiones regulares para detectar encabezados.

`remark` no está en `package.json` ni en `node_modules` del backend.

## Propuesta de corrección
Cambiar la entrada en la tabla de formatos a:

| Formato | Librería |
|---------|----------|
| Markdown | fs (lectura directa + regex para frontmatter y chunks) |

O eliminar la columna de librería si no es relevante para el lector de la documentación.

## Impacto del cambio

| Aspecto | Detalle |
|---------|---------|
| **Archivos a modificar** | `docs/guides/rag-concept.md` |
| **Riesgo** | Bajo — solo documentación |
| **Dependencias** | Ninguna |
| **Verificación** | Revisión visual |
