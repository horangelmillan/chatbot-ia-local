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
