# Growth Plan — ChatBot + IA Local

Plan de mejora técnica para cerrar la brecha entre mi conocimiento conceptual y la implementación concreta.

## Mapa de ruta

| Fase | Área | Tiempo estimado | Progreso |
|------|------|----------------|----------|
| 01 | JavaScript moderno (ES6+) | 2 semanas | Hecho |
| 02 | Testing en Node.js | 4 semanas | Pendiente |
| 03 | Express en producción | 1 semana | Pendiente |
| 04 | Patrones de base de datos | 1 semana | Pendiente |
| 05 | Arquitectura hexagonal real (DI, puertos) | 3 semanas | Pendiente |
| 06 | Producción real (caché, cola, Docker, hardening) | 2 semanas | Pendiente |
| 07 | SAPUI5 avanzado (OPA5, fragments, performance) | 2 semanas | Pendiente |
| **Total** | | **~15 semanas** | |

## Cómo usar este plan

Cada fase tiene 4 archivos:

- **README.md** — objetivos, conceptos clave, estimación
- **ejercicios.md** — tareas prácticas sobre el código del proyecto
- **guia.md** — explicación conceptual de los temas
- **checklist.md** — items para marcar avance

## Flujo de trabajo

1. Crear rama: `git checkout -b growth/fase-NN-nombre`
2. Leer README y guía de la fase
3. Ejecutar ejercicios sobre el código
4. Marcar items en checklist
5. Hacer commit de los cambios + documentación
6. Mergear a master: `git checkout master && git merge growth/fase-NN-nombre`
7. **No borrar la rama** — queda como evidencia del progreso

## Branching

Ver [branching-strategy.md](branching-strategy.md) para el detalle completo.
