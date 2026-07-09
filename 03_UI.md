# SAPUI5

## Vista

-   Lista de mensajes.
-   Input.
-   Botón Enviar.

No usar controles complejos.

## Flujo

Carga inicial:
- Se muestra mensaje de bienvenida con botones de opciones (WelcomeOptions.js)
- Al hacer clic en una opción o escribir, se envía POST /api/chat

Mostrar:

Usuario

Asistente (con botones dinámicos opcionales)

## Opciones de bienvenida

Definidas en `webapp/config/WelcomeOptions.js`. Cada opción tiene:
- `label`: texto del botón
- `message`: mensaje que se envía al backend

Para agregar una opción: añadir un objeto al array. Sin tocar el controller.

## Mensajes de prueba

¿Cuál es la orden 10248?

Muéstrame el cliente ALFKI.

¿Qué pedidos tiene VINET?

¿Quién ganó el mundial?

La última debe responder indicando que solo atiende consultas de
proveedores y facturación.
