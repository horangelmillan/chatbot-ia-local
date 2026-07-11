# Issue 01: Falta `DATABASE_URL` en `.env` ✅ RESUELTO

## Prioridad: 🔴 Crítica

## Documentación afectada
- `backend/db/pool.js` — línea 4: usa `process.env.DATABASE_URL`

## Qué dice la documentación
El archivo `backend/db/pool.js` conecta a PostgreSQL mediante:

```js
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...
});
```

Los documentos de arquitectura (`docs/architecture/context.md`, `docs/guides/rag-concept.md`) describen PostgreSQL 18 como base de datos del sistema.

## Qué hace realmente el código
El archivo `backend/.env` actual:

```
LM_STUDIO_URL=http://127.0.0.1:1234/v1
```

No existe la variable `DATABASE_URL`. Cualquier intento de conectar a la base de datos fallará porque `process.env.DATABASE_URL` será `undefined`.

No hay archivo `.env.example` ni documentación que indique al desarrollador qué variable debe configurar.

## Propuesta de corrección

### Opción A (recomendada): Agregar `DATABASE_URL` al `.env`
```
LM_STUDIO_URL=http://127.0.0.1:1234/v1
DATABASE_URL=postgresql://user:password@localhost:5432/chatbot_rag
```

### Opción B: Crear `.env.example`
Crear `backend/.env.example` con ambas variables documentadas, y mantener `.env` en `.gitignore` (ya está).

## Resolución

Se agregó `DATABASE_URL` a `backend/.env` y se creó `backend/.env.example` con ambas variables documentadas.

- `backend/.env`: ahora tiene `LM_STUDIO_URL` + `DATABASE_URL`
- `backend/.env.example`: archivo de referencia para nuevos desarrolladores

## Impacto del cambio

| Aspecto | Detalle |
|---------|---------|
| **Archivos a modificar** | `backend/.env` (o crear `backend/.env.example`) |
| **Riesgo** | Bajo — solo agrega configuración faltante |
| **Dependencias** | El usuario debe tener PostgreSQL 18 corriendo con la base `chatbot_rag` creada |
| **Verificación** | Iniciar backend y verificar que `pool.js` conecta sin error |
