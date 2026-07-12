# Documentacion de Arquitectura - Chatbot IA Local

## Estructura de documentos

- [Contexto del Sistema](architecture/context.md) — Vista general, actores y sistemas externos
- [Contenedores](architecture/containers.md) — Frontend, Backend y sus tecnologias
- [Componentes del Backend](architecture/components.md) — Internos del servidor Express
- [Despliegue](architecture/deployment.md) — Topologia fisica del sistema
- [Diagrama de Secuencia: Consulta de Datos](diagrams/sequences/chat-flow.md) — Flujo completo decideAction + OData + generateReply
- [Diagrama de Secuencia: Consulta Documental RAG](diagrams/sequences/document-rag.md) — Flujo de busqueda en cascada FAQ → Glosario → Chunks

## Diagrama Structurizr DSL

El archivo [workspace.dsl](architecture/workspace.dsl) contiene la definicion completa en Structurizr DSL con los niveles C4:
- **L1** — Contexto del sistema
- **L2** — Contenedores
- **L3** — Componentes del Backend
- **L4** — Despliegue fisico

Para visualizarlo, instala la extension `systemticks.c4-dsl-extension` en VS Code y abre `workspace.dsl`.

## Referencias

- [technical/](technical/) — Documentacion tecnica detallada (rendimiento, hardware, seguridad, cache)
- [guides/mvp-overview.md](guides/mvp-overview.md) — Vision general del proyecto
- [guides/rag-concept.md](guides/rag-concept.md) — Especificacion del motor RAG

## Skills de IA para el Desarrollo

El proyecto utiliza skills de IA para guiar el desarrollo en áreas específicas:

| Skill | Área | Propósito |
|-------|------|-----------|
| **[SAPUI5](../.agents/skills/sapui5/SKILL.md)** | Frontend | Desarrollo de interfaces OpenUI5/SAPUI5 |
| **[SAPUI5 CLI](../.agents/skills/sapui5-cli/SKILL.md)** | Frontend | Gestión del tooling UI5 |
| **[Arquitectura Hexagonal](../.agents/skills/hexagonal-architecture/SKILL.md)** | Backend | Diseño y refactorización con puertos y adaptadores |
| **[Express Backend](../.agents/skills/express-backend/SKILL.md)** | Backend | Patrones Express 4 para adaptadores inbound hexagonales |
| **[PostgreSQL Repository](../.agents/skills/node-pg-repository/SKILL.md)** | Backend | Patrones pg para adaptadores outbound hexagonales |
