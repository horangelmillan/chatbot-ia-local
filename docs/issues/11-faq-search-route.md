# Issue 11: Ruta documentada `/faq/search` no coincide con la real `/api/documents/faq/search`

## Prioridad: 🟠 Moderada

## Documentación afectada
- `docs/guides/rag-concept.md` — sección "API interna" (líneas 393-431)

## Qué dice la documentación
La documentación lista estos endpoints:

```
POST /documents/index
GET  /documents/search
GET  /documents/:id
GET  /faq/search
```

Falta el prefijo `/api`, y la ruta de FAQ se muestra como `/faq/search` en lugar de `/api/documents/faq/search`.

## Qué hace realmente el código
En `backend/server.js`:

```js
app.use("/api/documents", documentsRouter);
```

Y en `backend/routes/documents.js`:

```js
router.post("/index", ...)      → POST   /api/documents/index
router.get("/search", ...)       → GET    /api/documents/search
router.get("/faq/search", ...)   → GET    /api/documents/faq/search
router.get("/:id", ...)          → GET    /api/documents/:id
```

## Propuesta de corrección
Actualizar todas las rutas en `rag-concept.md` para incluir el prefijo `/api` y la ruta completa:

| Documentado | Correcto |
|-------------|----------|
| `POST /documents/index` | `POST /api/documents/index` |
| `GET /documents/search` | `GET /api/documents/search` |
| `GET /documents/:id` | `GET /api/documents/:id` |
| `GET /faq/search` | `GET /api/documents/faq/search` |

## Impacto del cambio

| Aspecto | Detalle |
|---------|---------|
| **Archivos a modificar** | `docs/guides/rag-concept.md` |
| **Riesgo** | Bajo — solo documentación |
| **Dependencias** | Ninguna |
| **Verificación** | Revisión visual |
