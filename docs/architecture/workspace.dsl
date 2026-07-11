workspace "Chatbot IA Local" "Asistente conversacional SAPUI5 con IA local, motor RAG y consultas OData" {

    model {
        proveedor = person "Proveedor" "Usuario que consulta datos de negocio (facturas, pedidos, clientes) y documentacion corporativa (FAQ, manuales)"

        chatbot = softwareSystem "SAPUI5 Chat" "Aplicacion conversacional para consulta de datos de negocio y documentacion corporativa via lenguaje natural" {
            webapp = container "Frontend" "SPA tipo chat con burbujas, botones dinamicos generados por IA y renderizado diferenciado para fragmentos documentales" "OpenUI5 1.150"

            backend = container "Backend" "API REST que orquesta clasificacion de intencion via LLM, consultas OData validadas, busqueda RAG y generacion de respuesta natural" "Node.js 22 + Express 4" {
                chatRouter = component "Chat Router" "routes/chat.js - Recibe POST /api/chat, clasifica intencion via LLM, ejecuta consultas OData validadas, busca documentacion" "Express Router"
                documentsRouter = component "Documents Router" "routes/documents.js - Endpoints de indexado, busqueda y recuperacion de documentos" "Express Router"
                documentEngine = component "Document Engine" "db/engine.js - Busqueda en cascada: FAQ (keywords), Chunks (FTS espanol)" "JavaScript"
                indexer = component "Indexer" "db/indexer.js - Parseo de MD/JSON/TXT con frontmatter, chunking de 800 palabras" "JavaScript"
                pgPool = component "PG Pool" "db/pool.js - Pool de conexiones PostgreSQL (max 5, timeout 30s)" "pg 8.x"
                lmClient = component "LM Client" "Cliente HTTP axios para API compatible OpenAI de LM Studio" "axios"

                chatRouter -> documentEngine "Busca fragmentos documentales"
                chatRouter -> lmClient "decideAction + generateReply"
                documentsRouter -> indexer "Indexa documentos"
                documentsRouter -> documentEngine "Busca fragmentos"
                documentsRouter -> pgPool "Consultas directas"
                indexer -> pgPool "INSERT documentos y chunks"
                documentEngine -> pgPool "SELECT FTS e ILIKE"
            }

            webapp -> backend "HTTP REST" "JSON, puerto 3001"
        }

        lmStudio = softwareSystem "LM Studio" "Servidor local de inferencia Qwen3 8B Q4_K_M, API compatible OpenAI, contexto 32K tokens, localhost:1234" {
            tags "External"
        }

        postgresql = softwareSystem "PostgreSQL 18" "Base de datos chatbot_rag con FTS espanol. Tablas: documents, document_chunks, faq" {
            tags "External"
        }

        northwind = softwareSystem "Northwind OData" "API OData externa services.odata.org (Orders, Customers, Order_Details). Solo GET validado. Sustituye a SAP S/4HANA Cloud en la demo." {
            tags "External"
        }

        proveedor -> webapp "Escribe mensajes en lenguaje natural"
        backend -> lmStudio "decideAction (temp 0.1) + generateReply (temp 0.8)"
        backend -> northwind "Consulta OData validada contra schema ALLOWED"
        backend -> postgresql "Busca documentacion (FAQ, Chunks FTS)"

        produccion = deploymentEnvironment "Produccion" {
            deploymentNode "Dispositivo Proveedor" "Browser moderno" "Chrome/Edge/Firefox" {
                containerInstance webapp
            }
            deploymentNode "Servidor Backend" "Windows o Linux" "Node.js 22 - :3001" {
                containerInstance backend
            }
            deploymentNode "Servidor GPU" "GPU 16GB+ VRAM" "LM Studio :1234" {
                softwareSystemInstance lmStudio
            }
            deploymentNode "Servidor Base de Datos" "PostgreSQL 18" "" {
                softwareSystemInstance postgresql
            }
            deploymentNode "Externo" "Northwind OData - services.odata.org" "Cloud" {
                softwareSystemInstance northwind
            }
        }
    }

    views {
        systemContext chatbot "contexto" "Diagrama de contexto del sistema. El Proveedor interactua con SAPUI5 Chat, que depende de LM Studio (IA), PostgreSQL (documentos) y Northwind OData (datos de negocio)." {
            include *
            autoLayout lr
        }

        container chatbot "containers" "Diagrama de contenedores: Frontend OpenUI5 en el navegador, Backend Node.js/Express, y sistemas externos." {
            include *
            autoLayout tb
        }

        component backend "componentes-backend" "Diagrama de componentes internos del backend Express." {
            include *
            autoLayout lr
        }

        deployment * produccion "despliegue" "Diagrama de despliegue fisico del sistema." {
            include *
            autoLayout tb
        }
    }
}
