# Issue 18: Discrepancia de versión UI5 entre `manifest.json` y `ui5.yaml`

## Prioridad: 🔵 Leve

## Documentación afectada
- `frontend/webapp/manifest.json` — línea 29: `"minUI5Version": "1.120.0"`
- `frontend/ui5.yaml` — línea 11: `version: "1.150.0"`

## Qué dice la documentación
`manifest.json` especifica que la versión mínima de UI5 requerida es **1.120.0**.

`ui5.yaml` especifica que el framework OpenUI5 usado es **1.150.0**.

## Qué hace realmente el código
Esto no es técnicamente incorrecto (1.150.0 ≥ 1.120.0, por lo que funciona). Sin embargo:

1. El proyecto se construye/sirve con OpenUI5 1.150.0
2. No hay razón para mantener el mínimo en 1.120.0
3. Si alguien intenta ejecutar con UI5 1.120.0, podría encontrar problemas con features de versiones intermedias no testeadas

## Propuesta de corrección
Actualizar `minUI5Version` en `manifest.json` para que coincida con la versión usada:

```json
"minUI5Version": "1.150.0"
```

O, alternativamente, mantener el mínimo si se quiere permitir versiones inferiores testeadas.

## Impacto del cambio

| Aspecto | Detalle |
|---------|---------|
| **Archivos a modificar** | `frontend/webapp/manifest.json` (línea 29) |
| **Riesgo** | Bajo |
| **Dependencias** | Ninguna |
| **Verificación** | `pnpm dev:frontend` debe seguir funcionando |
