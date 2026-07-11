# Issues de Inconsistencias — Documentación vs Implementación

Este directorio contiene issues individuales identificadas al revisar la documentación del proyecto contra el código real. Cada issue describe una inconsistencia y propone una corrección.

# Resolución de Issues (docs/issues/)

Cuando trabajes sobre issues documentados en `docs/issues/`:

**Cada issue se resuelve de forma INDIVIDUAL, UNO POR UNO.** Nunca en lote sin aprobación intermedia.

Por cada issue, debes:

1. **Presentar el issue al usuario** con su descripción, prioridad y propuesta de corrección.
2. **Esperar decisión y aprobación** del usuario antes de implementar.
3. **Implementar** los cambios acordados (código y/o documentación).
4. **Presentar el diff** de lo que se cambió para revisión del usuario.
5. **Avanzar al siguiente issue solo después de que el usuario confirme** que está de acuerdo con el resultado.

No implementes dos o más issues en paralelo sin haber cerrado cada uno individualmente con el usuario.

Este proceso está definido en `docs/issues/index.md` (ver "Proceso de resolución").

## Proceso de resolución

Cada issue se resuelve de forma **individual y conversada**:

1. **Evaluación conjunta**: se analiza el issue con el usuario para entender qué cambiar, por qué y cómo.
2. **Toma de decisión**: se discuten las opciones disponibles y se acuerda el enfoque.
3. **Implementación**: se aplican los cambios acordados (código y/o documentación).
4. **Documentación**: se marca el issue como resuelto y se registra la resolución.
5. **Commit**: los cambios se suben al repositorio.

No se implementa ningún cambio sin antes haberlo conversado y acordado con el usuario.

## Progresión

| Orden | Issue | Descripción | Prioridad | Estado |
|:-----:|:-----:|-------------|:---------:|:------:|
| 1 | [01-env-database.md](./01-env-database.md) | Falta `DATABASE_URL` en `.env` | 🔴 Crítica | ✅ |
| 2 | [03-schema-sql.md](./03-schema-sql.md) | No existe `schema.sql` con DDL de BD | 🔴 Crítica | ✅ |
| 3 | [02-glossary-insert.md](./02-glossary-insert.md) | Indexador nunca inserta en tabla `glossary` | 🔴 Crítica | ✅ |
| 4 | [10-mvp-intents.md](./10-mvp-intents.md) | MVP overview omite intent `continuation` | 🟡 Grave | ✅ |
| 5 | [12-enrich-flow.md](./12-enrich-flow.md) | `backend-rules.md` omite `enrichOrderContext` | 🟡 Grave | ✅ |
| 6 | [14-allowed-schema.md](./14-allowed-schema.md) | Ejemplo `ALLOWED` desactualizado en seguridad | 🟡 Grave | ✅ |
| 7 | [15-token-estimate.md](./15-token-estimate.md) | System prompt ~80 tokens, realidad ~400-500 | 🟡 Grave | ✅ |
| 8 | [16-history-asymmetry.md](./16-history-asymmetry.md) | Historial 20 msgs enviado, `decideAction` no lo usa | 🟡 Grave | ✅ |
| 9 | [13-continuation-flow.md](./13-continuation-flow.md) | `continuation` en tabla pero no en flujo documentado | 🟡 Grave | ✅ |
| 10 | [05-diagrama-api-pg.md](./05-diagrama-api-pg.md) | Diagrama erróneo: flecha API Cliente → PostgreSQL | 🟡 Grave | ✅ |
| 11 | [06-api-lan-vs-cloud.md](./06-api-lan-vs-cloud.md) | Seguridad dice API en LAN, es cloud (Internet) | 🟡 Grave | ✅ |
| 12 | [19-proxy-location.md](./19-proxy-location.md) | Proxy documentado como backend, es frontend | 🟡 Grave | ✅ |
| 13 | [08-formatos-soporte.md](./08-formatos-soporte.md) | PDF/DOCX listados como soportados, no implementados | 🟠 Moderada | |
| 14 | [21-remark-library.md](./21-remark-library.md) | "remark" listado como librería, no se usa | 🟠 Moderada | ✅ |
| 15 | [11-faq-search-route.md](./11-faq-search-route.md) | Ruta `/faq/search` vs `/api/documents/faq/search` | 🟠 Moderada | ✅ |
| 16 | [07-lastcontext.md](./07-lastcontext.md) | `lastContext` global, docs dicen "por sesión" | 🟠 Moderada | |
| 17 | [04-llm-queue.md](./04-llm-queue.md) | Cola de requests LLM documentada no implementada | 🟠 Moderada | |
| 18 | [20-pm2-dependency.md](./20-pm2-dependency.md) | PM2 mencionado, no instalado ni configurado | 🟠 Moderada | |
| 19 | [09-embedding-type.md](./09-embedding-type.md) | `embedding` como TEXT vs VECTOR (autocontradictorio) | 🟠 Moderada | |
| 20 | [17-i18n-unused.md](./17-i18n-unused.md) | Claves i18n `reconCostos` y `typingIndicator` no usadas | 🔵 Leve | ✅ |
| 21 | [18-ui5-version.md](./18-ui5-version.md) | Version mismatch: `minUI5Version` 1.120 vs OpenUI5 1.150 | 🔵 Leve | ✅ |

## Leyenda

| Etiqueta | Significado |
|:--------:|-------------|
| 🔴 Crítica | Rompe funcionalidad — el sistema no funciona o una feature nunca se ejecuta |
| 🟡 Grave | Información contradictoria o engañosa que lleva a decisiones incorrectas |
| 🟠 Moderada | Documentación incompleta o imprecisa |
| 🔵 Leve | Detalle menor, documentación huérfana, limpieza |
