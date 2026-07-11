# Issue 02: Indexador nunca inserta en tabla `glossary` ✅ RESUELTO

## Prioridad: 🔴 Crítica

## Documentación afectada
- `docs/guides/rag-concept.md` — modelo de datos tabla `glossary` (líneas 233-240)
- `docs/architecture/components.md` — describe Document Engine y búsqueda en cascada
- `docs/guides/backend-rules.md` — menciona búsqueda ILIKE en glosario

## Qué dice la documentación
La documentación (`rag-concept.md`) define la tabla `glossary` con columnas `id`, `term`, `definition`, `category`. El Document Engine (`db/engine.js`) implementa `searchGlossary()` que busca mediante ILIKE sobre esta tabla.

El archivo `knowledge-base/glossary/glosario-financiero.md` contiene términos como "Factura Electrónica", "RUT", "IVA" con sus definiciones.

## Qué hace realmente el código
El indexador (`backend/db/indexer.js`) solo inserta en dos tablas:

1. **`documents`** — siempre (líneas 93-96)
2. **`document_chunks`** — siempre que hay contenido (líneas 104-106)
3. **`faq`** — solo si el frontmatter contiene `keywords`, `question` y `answer` (líneas 110-115)

**No existe lógica que inserte en la tabla `glossary`.** El frontmatter del glosario no tiene campos `question`/`answer`, así que tampoco se inserta como FAQ. El resultado es que `searchGlossary()` en `engine.js` (líneas 22-32) siempre retorna `null`, y la búsqueda en cascada salta directamente de FAQ a Chunks, ignorando el glosario.

## Propuesta de corrección

### Opción A: Agregar inserción a `glossary` en el indexador
En `indexer.js`, después de la inserción a `faq`, detectar si el documento es un glosario (por categoría o por presencia de `term`/`definition` en frontmatter) e insertar registros en la tabla `glossary`.

Ejemplo de detección: si el frontmatter contiene pares `term` / `definition`, o si el cuerpo del documento tiene entradas con formato `### Término\ndefinición`.

### Opción B: Eliminar la tabla y función de búsqueda de glosario
Si el glosario se considera innecesario (los términos pueden buscarse como chunks regulares), eliminar:
- La tabla `glossary` del schema de BD
- La función `searchGlossary()` en `engine.js`
- La referencia al glosario en el algoritmo de búsqueda en cascada
- Las entradas de documentación correspondientes

## Resolución

Se eliminó el concepto de glosario del proyecto (Opción B):
- `backend/db/engine.js`: eliminadas `searchGlossary()` y su llamada en cascada
- `backend/routes/chat.js`: eliminado el branch `result.type === "glossary"`
- Documentación: eliminadas todas las referencias a glosario en 9 archivos
- `knowledge-base/glossary/glosario-financiero.md`: se conserva, se indexa como chunk regular (markdown) — los términos siguen siendo buscables vía Full Text Search

## Impacto del cambio

| Aspecto | Detalle |
|---------|---------|
| **Archivos a modificar** | `backend/db/engine.js` + `backend/routes/chat.js` + docs (9 archivos) |
| **Riesgo** | Bajo — el glosario nunca se pobló, la rama glossary nunca se ejecutaba |
| **Dependencias** | Ninguna |
| **Verificación** | `engine.search()` ya no incluye paso glossary. Los términos del glosario se encuentran igual vía búsqueda FTS en chunks. |
