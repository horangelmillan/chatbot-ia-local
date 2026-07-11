# Issue 19: Proxy de desarrollo documentado como feature del backend, pero está en frontend

## Prioridad: 🟡 Grave

## Documentación afectada
- `docs/technical/01_arquitectura.md` — línea 87: "Proxy para desarrollo (ui5-middleware-simpleproxy)"

## Qué dice la documentación
El documento `01_arquitectura.md`, en la sección "Backend (Node.js + Express)", lista:

> Puerto 3001
> Proxy para desarrollo (ui5-middleware-simpleproxy)
> Caché en memoria de última consulta (lastContext)

Esto sugiere que el proxy es parte del backend.

## Qué hace realmente el código
El proxy `ui5-middleware-simpleproxy` está configurado en el **frontend**, en `frontend/ui5.yaml` (líneas 20-24):

```yaml
- name: ui5-middleware-simpleproxy
  afterMiddleware: compression
  mountPath: /api
  configuration:
    baseUri: http://localhost:3001
```

El middleware funciona dentro del servidor de desarrollo del frontend (OpenUI5 tooling). Proxy las peticiones `/api` desde el frontend (puerto 8080) hacia el backend (puerto 3001).

No es una funcionalidad del backend. El backend (`server.js`) no tiene proxy configurado — solo sirve su API directamente.

## Propuesta de corrección
Mover la mención del proxy a la sección "Frontend (SAPUI5)" dentro del mismo documento, o al menos aclarar:

> **Proxy de desarrollo:** el frontend usa `ui5-middleware-simpleproxy` en su servidor de desarrollo (`ui5.yaml`) para redirigir peticiones `/api` al backend en `localhost:3001`.

## Impacto del cambio

| Aspecto | Detalle |
|---------|---------|
| **Archivos a modificar** | `docs/technical/01_arquitectura.md` |
| **Riesgo** | Bajo — solo documentación |
| **Dependencias** | Ninguna |
| **Verificación** | Revisión visual |
