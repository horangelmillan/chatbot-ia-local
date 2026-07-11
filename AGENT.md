# AGENT.md

## Objetivo

Este documento define el comportamiento esperado de cualquier agente de IA que participe en el desarrollo del proyecto.

El objetivo principal es preservar la calidad del software, comprender el contexto antes de realizar cambios y mantener la consistencia de la arquitectura.

---

# Principios Fundamentales

1. Comprender antes de modificar.
2. Nunca asumir información que pueda verificarse.
3. Respetar la arquitectura existente.
4. Mantener la consistencia del proyecto.
5. Priorizar código claro y mantenible sobre soluciones rápidas.
6. Evitar introducir deuda técnica.
7. Documentar las decisiones importantes.
8. Explicar el razonamiento cuando una decisión implique cambios relevantes.

---

# Flujo de Trabajo Obligatorio

Antes de implementar cualquier solicitud, sigue este proceso.

## Fase 1 - Comprensión

Analiza el proyecto antes de realizar cambios.

Debes:

* Identificar la arquitectura utilizada.
* Comprender la estructura de carpetas.
* Identificar los módulos principales.
* Comprender el flujo de datos.
* Detectar las convenciones del proyecto.
* Leer la documentación disponible.
* Localizar implementaciones similares que puedan reutilizarse.

No escribas código durante esta fase.

---

## Fase 2 - Obtención de Contexto

Utiliza todas las herramientas disponibles que aporten información útil.

Siempre que estén disponibles:

* Ponytail
* Context7
* Codebase Memory
* MCP disponibles
* Playwright
* Herramientas de análisis del proyecto
* Documentación del repositorio

Si una herramienta no aporta valor para la tarea solicitada, explica brevemente por qué no se utiliza.

Nunca sustituyas el análisis del código por información parcial proveniente de una herramienta externa.

---

## Fase 3 - Planificación

Antes de modificar código:

* Explica brevemente el problema.
* Describe la solución propuesta.
* Identifica los archivos que serán modificados.
* Indica posibles impactos.
* Señala riesgos si existen.
* **Evalúa si el cambio afecta la arquitectura** (nuevos módulos, capas, servicios, APIs, bases de datos, colas, cachés, servicios externos o cambios en la comunicación entre componentes). Si es así, planifica la actualización de los diagramas en `docs/architecture/` y `docs/diagrams/`.

Cuando el cambio sea pequeño, este resumen puede ser breve.

---

## Fase 4 - Implementación

Durante la implementación:

* Mantén el estilo existente.
* Reutiliza componentes existentes.
* Evita duplicar lógica.
* Mantén nombres consistentes.
* No introduzcas dependencias innecesarias.
* Mantén compatibilidad con el resto del proyecto.
* Realiza cambios mínimos cuando sea posible.

No realices refactorizaciones no relacionadas con la tarea salvo que sean necesarias para resolver el problema.

---

## Fase 5 - Validación

Después de implementar:

* Ejecuta pruebas si están disponibles.
* Corrige errores encontrados.
* Revisa posibles regresiones.
* Verifica que no existan errores de compilación.
* Comprueba que el comportamiento esperado se mantiene.

Si no es posible ejecutar pruebas, indícalo explícitamente.

---

# Calidad del Código

El código debe ser:

* Legible.
* Mantenible.
* Modular.
* Reutilizable.
* Consistente.
* Fácil de entender.

Evita:

* Código duplicado.
* Variables ambiguas.
* Funciones excesivamente largas.
* Comentarios innecesarios.
* Soluciones temporales sin justificar.

---

# Uso de Herramientas

Siempre que sea posible:

* Utiliza Ponytail para recuperar contexto del proyecto.
* Utiliza los MCP disponibles cuando puedan mejorar la respuesta.
* Utiliza Context7 para documentación de librerías o frameworks.
* Utiliza Playwright para validar interfaces o flujos cuando corresponda.

No fuerces el uso de herramientas si no aportan valor.

---

# Gestión de Errores

Cuando encuentres un problema:

1. Identifica la causa raíz.
2. Explica por qué ocurre.
3. Propón la solución.
4. Implementa únicamente la solución necesaria.
5. Verifica que el problema desaparezca.

Evita aplicar soluciones superficiales sin comprender el origen del fallo.

---

# Refactorización

Cuando refactorices:

* No cambies el comportamiento funcional.
* Reduce complejidad.
* Elimina duplicaciones.
* Mejora legibilidad.
* Conserva la compatibilidad existente.

---

# Rendimiento

Antes de introducir cambios importantes considera:

* Complejidad algorítmica.
* Uso de memoria.
* Consultas innecesarias.
* Renderizados redundantes.
* Llamadas repetidas.
* Operaciones bloqueantes.

Optimiza únicamente cuando exista un beneficio claro.

---

# Seguridad

Nunca:

* Expongas credenciales.
* Hardcodees secretos.
* Desactives validaciones de seguridad.
* Introduzcas código inseguro.

Respeta siempre las buenas prácticas de seguridad del proyecto.

---

# Documentación

Cuando un cambio sea relevante:

* Actualiza la documentación correspondiente.
* Añade notas técnicas cuando sea necesario.
* Mantén sincronizada la documentación con el código.
* **Si el cambio afecta la arquitectura**, sigue el flujo: actualizar diagrama → actualizar documentación → verificar coherencia → eliminar elementos obsoletos. Los diagramas viven en `docs/architecture/` (Structurizr DSL + Mermaid) y `docs/diagrams/` (Mermaid).

---

# Skills Disponibles

El proyecto incluye skills de IA para tareas específicas. El agente debe cargar el skill correspondiente cuando la tarea coincida con su activación:

| Skill | Activación | Propósito |
|-------|-----------|-----------|
| `sapui5` | Tareas de frontend (vistas XML, controladores, manifest.json, i18n, OPA5) | Desarrollo de interfaces SAPUI5/OpenUI5, MVC, data binding, tests |
| `sapui5-cli` | Configuración de build, ui5.yaml, middlewares, servidor dev | Gestión del pipeline UI5 Tooling |
| `hexagonal-architecture` | Refactorización del backend, separación de capas, nuevos módulos, adaptadores | Diseño guiado por dominio, puertos y adaptadores, composición limpia |

# Comunicación

Durante el trabajo:

* Sé conciso.
* Justifica decisiones importantes.
* No ocultes limitaciones.
* Indica claramente cualquier incertidumbre.
* Diferencia hechos comprobados de suposiciones.

---

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

---

# Definición de Finalización

Una tarea se considera terminada únicamente cuando:

* Se comprende el problema.
* Se implementa la solución.
* El código mantiene la arquitectura existente.
* Las pruebas disponibles son satisfactorias o se informa por qué no pudieron ejecutarse.
* No quedan errores conocidos relacionados con la tarea.

---

# Regla Final

Antes de responder, pregúntate:

* ¿He comprendido realmente el problema?
* ¿Existe ya una solución similar en el proyecto?
* ¿Estoy reutilizando código existente?
* ¿Estoy respetando la arquitectura?
* ¿He validado el resultado?
* ¿Mi propuesta mejora el proyecto sin introducir deuda técnica?

Si alguna respuesta es "no", completa ese paso antes de dar la tarea por finalizada.
