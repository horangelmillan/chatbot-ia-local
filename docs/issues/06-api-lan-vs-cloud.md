# Issue 06: Documentación de seguridad describe API Cliente como LAN, pero es cloud

## Prioridad: 🟡 Grave

## Documentación afectada
- `docs/technical/05_seguridad.md` — diagrama de "Aislamiento de Red" (líneas 48-55) y sección "Sin exposures de API keys" (líneas 41-45)

## Qué dice la documentación
El documento de seguridad presenta este diagrama de red:

```
[Proveedor Internet] ──▶ [Frontend] ──▶ [Backend] ──▶ [API Cliente (LAN)]
                                                │
                                                ▼
                                          [LM Studio (localhost:1234)]
                                          (sin acceso a internet)
```

Y afirma:
> - API del cliente solo es accesible desde la red interna

## Qué hace realmente el código
La API del cliente es **Northwind OData**, ubicada en `services.odata.org` — un servicio público en Internet. El backend la consulta mediante HTTPS:

```js
const NW_BASE = "https://services.odata.org/V3/Northwind/Northwind.svc";
```

Esto implica que:
- El backend necesita acceso a Internet (no es aislado)
- Los datos viajan a través de Internet (no son LAN)
- El diagrama de aislamiento de red es incorrecto

La documentación describe un escenario de seguridad ideal (API del cliente en LAN corporativa) que no corresponde con la implementación actual (API pública de demostración).

## Propuesta de corrección

### Opción A: Corregir la documentación para reflejar la realidad actual
Cambiar todas las referencias de "API Cliente (LAN)" a "Northwind OData (Internet)" en los diagramas y textos de seguridad. Aclarar que en un escenario real de producción, la API del cliente estaría en LAN.

### Opción B: Agregar nota aclaratoria
Mantener el diagrama de seguridad como "visión de producción" pero agregar una nota explícita:

> **Nota:** La implementación actual usa Northwind OData (`services.odata.org`) como API de demostración, que es un servicio público en Internet. En un despliegue productivo, esta API sería reemplazada por la API del cliente en la red interna (LAN).

## Impacto del cambio

| Aspecto | Detalle |
|---------|---------|
| **Archivos a modificar** | `docs/technical/05_seguridad.md` |
| **Riesgo** | Bajo — solo documentación |
| **Dependencias** | Ninguna |
| **Verificación** | Revisión visual de la corrección |

## Resolución

✅ Implementada **Opción A**: corregido diagrama de red en `05_seguridad.md` (API Cliente (LAN) → Northwind OData (Internet)). Actualizada sección de aislamiento de red con nota sobre despliegue productivo. Cerrado en lote 2026-07-11.
