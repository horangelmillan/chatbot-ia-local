# Backend

## Endpoint

POST /chat

Body

``` json
{
  "message":"texto del usuario"
}
```

## Flujo

1.  Recibir mensaje.
2.  Pedir al LLM que clasifique:

-   order
-   customer
-   invoice
-   unknown

Responder únicamente JSON.

Ejemplo:

``` json
{
 "intent":"order",
 "id":"10248"
}
```

3.  Según la intención:

order: GET /Orders(10248)

customer: GET /Customers('ALFKI')

invoice: Simular con Orders.

unknown: No consultar OData.

4.  Construir un prompt:

Eres un asistente especializado únicamente en proveedores, órdenes y
facturación.

Usa EXCLUSIVAMENTE la información entregada.

Si la pregunta no pertenece al dominio responde:

"No puedo ayudar con esa consulta. Soy un asistente especializado en
procesos de proveedores y facturación."

Nunca inventes datos.

5.  Enviar al LM Studio.

6.  Devolver la respuesta al frontend.
