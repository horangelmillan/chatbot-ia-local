# Estrategia de Ramas — Growth Plan

## Principio

Cada fase de mejora tiene su propia rama persistente. Las ramas **no se borran** después de mergear a master. Sirven como evidencia histórica del progreso como programador.

## Estructura

```
master
  │
  ├── growth/fase-01-javascript-moderno     ← persistente
  ├── growth/fase-02-testing-nodejs         ← persistente
  ├── growth/fase-03-express-produccion     ← persistente
  ├── growth/fase-04-patterns-bd            ← persistente
  ├── growth/fase-05-arquitectura-di        ← persistente
  ├── growth/fase-06-produccion-real        ← persistente
  └── growth/fase-07-sapui5-avanzado        ← persistente
```

## Dinámica por fase

```bash
# 1. Partir de master
git checkout master
git pull

# 2. Crear rama de la fase
git checkout -b growth/fase-NN-nombre

# 3. Trabajar: leer documentación, hacer ejercicios, commitar cambios
git add .
git commit -m "feat(es6): reemplazar var por const/let en ChatUseCase.js"
git commit -m "docs(growth): marcar checklist fase 1"

# 4. Al completar la fase, mergear a master
git checkout master
git merge growth/fase-NN-nombre

# 5. NO borrar la rama
# git branch -d growth/fase-NN-nombre  ← NO hacer esto
```

## Convención de commits

```
feat(<area>): <acción> en <archivo>
fix(<area>): <qué se corrigió>
docs(growth): <actualización de documentación del plan>
```

Ejemplos:

```
feat(es6): convertir funciones a arrow functions en routes/chat.js
feat(es6): reemplazar concatenación por template literals en ChatUseCase.js
docs(growth): marcar checklist fase 1 completo
```

## Visualizar progreso

```bash
git log --all --graph --oneline --decorate
```

Muestra todas las ramas y commits. Las ramas `growth/*` encapsulan cada etapa de mejora.

## Histórico de ramas completadas

| Rama | Fase | Estado |
|------|------|--------|
| `growth/fase-01-javascript-moderno` | JavaScript moderno | Hecho |
| `growth/fase-02-testing-nodejs` | Testing | Pendiente |
| `growth/fase-03-express-produccion` | Express producción | Pendiente |
| `growth/fase-04-patterns-bd` | BD patrones | Pendiente |
| `growth/fase-05-arquitectura-di` | Arquitectura + DI | Pendiente |
| `growth/fase-06-produccion-real` | Producción real | Pendiente |
| `growth/fase-07-sapui5-avanzado` | SAPUI5 avanzado | Pendiente |
