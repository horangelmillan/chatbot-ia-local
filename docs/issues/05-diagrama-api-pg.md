# Issue 05: Diagrama de `01_arquitectura.md` muestra flecha incorrecta API Cliente → PostgreSQL

## Prioridad: 🟡 Grave

## Documentación afectada
- `docs/technical/01_arquitectura.md` — diagrama de flujo (líneas 5-46)

## Qué dice la documentación
El diagrama ASCII muestra una conexión directa desde "API Cliente (OData/REST)" hacia "PostgreSQL chatbot_rag":

```
                          ┌──────────────────┐
                          │   PostgreSQL     │◀─────────────────────────┘
                          │  chatbot_rag     │
                          └──────────────────┘
                               ▲
                               │
                          ┌──────────────┐
                          │  Document    │
                          │  Engine      │
                          └──────────────┘
```

La flecha desde "API Cliente" (Northwind OData) hacia PostgreSQL sugiere que Northwind escribe o lee de la base de datos documental.

## Qué hace realmente el código
Northwind OData (`services.odata.org`) es un API externa de datos de negocio. PostgreSQL almacena documentos corporativos (FAQ, manuales). No existe relación alguna entre Northwind y PostgreSQL.

Las conexiones reales son:
- **Backend → Northwind OData**: consultas de negocio (Orders, Customers, Order_Details)
- **Backend → PostgreSQL**: búsqueda documental vía Document Engine
- **Backend → LM Studio**: clasificación y generación de respuestas

## Propuesta de corrección
Corregir el diagrama eliminando la flecha de API Cliente a PostgreSQL, y en su lugar conectar Backend directamente a ambos:

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Proveedor  │────▶│  Frontend    │────▶│  Backend     │────▶│ Northwind    │
│  (Browser)  │     │  SAPUI5      │     │  Node.js     │     │ OData (REST) │
└─────────────┘     └──────────────┘     └──────┬───────┘     └──────────────┘
                                                │
                                          ┌─────┴──────┐
                                          │ LM Studio   │
                                          │ Qwen3 8B    │
                                          └────────────┘
                                                │
                                          ┌─────┴──────────┐
                                    ┌─────┤ PostgreSQL 18  │
                                    │     │ chatbot_rag    │
                                    │     └────────────────┘
                                    │
                               ┌────┴───────────┐
                               │ Document Engine │
                               └────────────────┘
                                    ▲
                                    │
                               ┌────┴───────┐
                               │  Indexador │
                               └────────────┘
                                    ▲
                                    │
                               ┌────┴──────────┐
                               │  Documentos   │
                               │ (MD, JSON,TXT)│
                               └───────────────┘
```

## Impacto del cambio

| Aspecto | Detalle |
|---------|---------|
| **Archivos a modificar** | `docs/technical/01_arquitectura.md` (diagrama + descripción) |
| **Riesgo** | Bajo — solo documentación |
| **Dependencias** | Ninguna |
| **Verificación** | Revisión visual del diagrama corregido |

## Resolución

✅ Reemplazado diagrama ASCII en `01_arquitectura.md`: eliminada flecha incorrecta API Cliente → PostgreSQL, conectado Backend directamente a Northwind OData. Cerrado en lote 2026-07-11.
