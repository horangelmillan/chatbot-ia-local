# Seguridad

## Principio: El LLM no toca datos sensibles

La arquitectura garantiza que el modelo de lenguaje **nunca accede directamente** a la base de datos del cliente.

## Capas de Seguridad

### 1. Schema Validation (Validación de Consultas)

El backend define un schema estricto de lo que el LLM puede consultar:

```javascript
const ALLOWED = {
  Orders: { filters: ["OrderID", "CustomerID", "ShipCountry"] },
  Customers: { filters: ["CustomerID", "CompanyName"] },
  Order_Details: { filters: ["OrderID", "ProductID"] }
};
```

Si el LLM intenta una entidad, filtro o relación que no existe → el backend lo rechaza.

### 2. El LLM solo ve datos ya filtrados

```
API del Cliente (datos completos)
        │
        ▼
Backend ejecuta la consulta (solo GET, nunca POST/PUT/DELETE)
        │
        ▼
Backend formatea SOLO los datos necesarios para responder
        │
        ▼
LLM recibe texto plano: "Orden #10248 - Cliente: Vins... - Total: $X"
        │
        ▼
LLM genera respuesta natural basada en ese texto
```

### 3. Sin exposures de API keys

- Las credenciales del cliente están en `.env` del backend
- El frontend no tiene acceso a ninguna API key
- El LLM no tiene acceso a internet, solo a lo que el backend le pasa

### 4. Aislamiento de Red

```
[Proveedor Internet] ──▶ [Frontend] ──▶ [Backend] ──▶ [API Cliente (LAN)]
                                                │
                                                ▼
                                          [LM Studio (localhost:1234)]
                                          (sin acceso a internet)
```

- LM Studio corre en `127.0.0.1` — solo accesible desde el backend
- Backend solo expone `/api/chat` (POST) al frontend
- API del cliente solo es accesible desde la red interna

### 5. Sin datos persistentes

- El historial de conversación **no se almacena en disco**
- `lastContext` está en memoria volátil
- Si se reinicia el servidor, se pierde completamente
- El frontend mantiene el historial solo para contexto del LLM

### 6. Control de acceso

- El frontend puede integrarse con cualquier sistema de login existente
- El backend puede validar tokens/sesiones antes de procesar requests
- Toda comunicación es HTTP (o HTTPS si se configura certificado)

## Comparativa: Chatbot Local vs SaaS

| Aspecto | Chatbot Local | SAP AI / Cloud |
|---------|:-------------:|:--------------:|
| Datos salen de la empresa | ❌ No | ✅ Sí (van a SAP/OpenAI) |
| Control de acceso | Total | Depende del plan |
| Latencia de red | 0 (local) | 100-300ms |
| Dependencia externa | Ninguna | Proveedor cloud |
| Cumplimiento (GDPR, etc.) | Más fácil | Requiere contrato DPA |
