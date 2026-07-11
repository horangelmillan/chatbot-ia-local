# Issue 14: Ejemplo de `ALLOWED` en documentación de seguridad desactualizado

## Prioridad: 🟡 Grave

## Documentación afectada
- `docs/technical/05_seguridad.md` — sección "Schema Validation" (líneas 9-20)

## Qué dice la documentación
```javascript
const ALLOWED = {
  Orders: { filters: ["OrderID", "CustomerID", "ShipCountry"] },
  Customers: { filters: ["CustomerID", "CompanyName"] },
  Order_Details: { filters: ["OrderID", "ProductID"] }
};
```

Este ejemplo es una versión simplificada que omite:
- Filtros adicionales existentes (`ShipCity`, `OrderDate`, `Country`, `City`)
- La propiedad `expand` (relaciones permitidas)
- La propiedad `maxTop` (límite de resultados)

## Qué hace realmente el código
`chat.js` (líneas 9-13):

```javascript
const ALLOWED = {
  Orders: { filters: ["OrderID", "CustomerID", "ShipCountry", "ShipCity", "OrderDate"], expand: ["Customer", "Order_Details"], maxTop: 50 },
  Customers: { filters: ["CustomerID", "CompanyName", "Country", "City"], expand: ["Orders"], maxTop: 50 },
  Order_Details: { filters: ["OrderID", "ProductID"], expand: ["Order"], maxTop: 50 }
};
```

Además, `validateQuery()` (líneas 24-41) valida:
- Entidad existe en ALLOWED
- Cada filtro está en `allowed.filters`
- Operador solo `eq`
- Cada expand está en `allowed.expand`
- Top entre 1 y `allowed.maxTop`

## Propuesta de corrección
Sincronizar el ejemplo de `05_seguridad.md` con el código real:

```javascript
const ALLOWED = {
  Orders: { filters: ["OrderID", "CustomerID", "ShipCountry", "ShipCity", "OrderDate"], expand: ["Customer", "Order_Details"], maxTop: 50 },
  Customers: { filters: ["CustomerID", "CompanyName", "Country", "City"], expand: ["Orders"], maxTop: 50 },
  Order_Details: { filters: ["OrderID", "ProductID"], expand: ["Order"], maxTop: 50 }
};
```

## Impacto del cambio

| Aspecto | Detalle |
|---------|---------|
| **Archivos a modificar** | `docs/technical/05_seguridad.md` |
| **Riesgo** | Bajo — solo documentación |
| **Dependencias** | Ninguna |
| **Verificación** | Revisión visual de que coincida con `backend/routes/chat.js:9-13` |

## Resolución

✅ Sincronizado ejemplo `ALLOWED` en `05_seguridad.md` con el código real (agregados `expand` y `maxTop`). Cerrado en lote 2026-07-11.
