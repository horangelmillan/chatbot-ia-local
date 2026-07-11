# Issue 17: Claves i18n no utilizadas

## Prioridad: 🔵 Leve

## Documentación afectada
- `frontend/webapp/i18n/i18n.properties` — líneas 7-8

## Qué dice la documentación
El archivo `i18n.properties` contiene las claves:

```properties
reconCostos=Reconocer costos
typingIndicator=El asistente esta escribiendo...
```

## Qué hace realmente el código
Ninguna de estas claves se referencia en:

- `App.view.xml` (no hay binding `{i18n>reconCostos}` ni `{i18n>typingIndicator}`)
- `App.controller.js` (no se accede a estas claves)
- Ningún otro archivo del frontend

Son claves huérfanas que probablemente quedaron de una versión anterior o de un feature planeado pero no implementado (ej: indicador de escritura del asistente).

## Propuesta de corrección
Eliminar ambas líneas de `i18n.properties` para mantener solo claves utilizadas. Si se planea implementar el "typing indicator" o la funcionalidad de "reconocer costos", documentarlo en un TODO o issue de feature.

## Impacto del cambio

| Aspecto | Detalle |
|---------|---------|
| **Archivos a modificar** | `frontend/webapp/i18n/i18n.properties` |
| **Riesgo** | Bajo — son claves muertas, no referenciadas |
| **Dependencias** | Ninguna |
| **Verificación** | `grep -r "reconCostos\|typingIndicator" frontend/webapp/` (sin resultados) |
