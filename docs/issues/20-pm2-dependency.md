# Issue 20: PM2 mencionado como solución de escalabilidad, no instalado ni configurado

## Prioridad: 🟠 Moderada

## Documentación afectada
- `docs/technical/04_cache_y_escalabilidad.md` — sección "Escalabilidad Horizontal" (líneas 25-58)

## Qué dice la documentación
> Opción 1: Múltiples workers (un solo equipo)
>
> ```
>                      ┌──────────────┐
>                      │  Load        │
>                      │  Balancer    │
>                      │  (Node PM2)  │
>                      └──────┬───────┘
> ```

Y en la tabla de proyección (líneas 61-66):
> 500 usuarios/día: RX 9070 XT + PM2 | Caché + 2 workers | 3-6s

## Qué hace realmente el código
- `package.json` (root) y `backend/package.json` no incluyen `pm2` como dependencia
- No hay archivo de configuración de PM2 (`ecosystem.config.js`, `process.json`, etc.)
- El script `start` en backend/package.json es solo `node server.js`, no usa PM2
- No hay script `dev` ni `start` que utilice PM2

## Propuesta de corrección

### Opción A: Implementar PM2
1. Agregar `pm2` como devDependency en el package.json raíz
2. Crear `ecosystem.config.js` con configuración de workers
3. Agregar scripts npm: `"start:prod": "pm2 start ecosystem.config.js"`
4. Actualizar documentación con la configuración real

### Opción B: Eliminar mención de PM2
Si el escalamiento con PM2 no es una prioridad actual, eliminar las referencias y marcar como "futura mejora".

## Resolución

✅ Implementada **Opción B**: eliminadas referencias a PM2 en `04_cache_y_escalabilidad.md`. Reemplazado por NGINX en diagrama de escalabilidad.

## Impacto del cambio

| Aspecto | Detalle |
|---------|---------|
| **Archivos a modificar** | Opción A: `package.json` + crear `ecosystem.config.js`. Opción B: `docs/technical/04_cache_y_escalabilidad.md` |
| **Riesgo** | Bajo en ambos casos |
| **Dependencias** | Ninguna |
| **Verificación** | Opción A: `pm2 status` debe mostrar los workers |
