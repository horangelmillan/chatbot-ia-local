# Caché y Escalabilidad

## Caché de Respuestas Frecuentes

### El 80% de las preguntas son repetitivas

En un entorno de proveedores, las consultas más comunes son:

- "¿Qué facturas se pagaron hoy?" → misma respuesta para todos
- "¿Cuál es mi saldo?" → varía por proveedor
- "¿Estado de la orden X?" → varía por orden

### Estrategia de Caché

| Tipo | TTL | Beneficio |
|------|:---:|:---------:|
| Respuestas genéricas (ej: "facturas pagadas hoy") | 5 min | Consulta 1 sola vez, responde instantáneo |
| Respuestas por entidad (ej: orden X) | 2 min | Si 3 proveedores preguntan por la misma orden seguido |
| Último contexto (lastContext) | Global (v1, compartido) | "Analiza esa orden" sin re-consultar API. En v2: por sesión con X-Session-ID |

### Sin dependencias adicionales

La caché se implementa con un `Map` en memoria en el backend Node.js, sin Redis ni base de datos extra.

## Escalabilidad Horizontal

### Opción 1: Múltiples workers (un solo equipo)

```
                     ┌──────────────┐
                     │  Load        │
                     │  Balancer    │
                      │  (NGINX)      │
                     └──────┬───────┘
                    ┌───────┴───────┐
                    │               │
              ┌─────┴─────┐   ┌─────┴─────┐
              │ Worker 1  │   │ Worker 2  │
              │ (CPU 0-3) │   │ (CPU 4-7) │
              └─────┬─────┘   └─────┬─────┘
                    │               │
                    └───────┬───────┘
                     ┌──────┴──────┐
                     │  LM Studio  │
                     │  (GPU)      │
                     └─────────────┘
```

### Opción 2: Servidor dedicado + workers

Para más de 500 consultas/día:

| Componente | Cantidad | Rol |
|-----------|:--------:|-----|
| Equipo con GPU | 1 | Correr LLM (LM Studio server) |
| Servidor backend | 1-N | Workers Node.js detrás de NGINX |
| API Cliente | — | La existente |

## Proyección de Crecimiento

| Usuarios/día | Equipo | Configuración | Tiempo respuesta |
|:-----------:|:------:|:-------------:|:----------------:|
| 50 | RX 9070 XT | Simple | 3-4s |
| 200 | RX 9070 XT | Con caché | 2-5s |
| 500 | RX 9070 XT + workers | Caché + 2 workers | 3-6s |
| 1000 | RTX 4090 + servidor backend | Caché + 4 workers | 3-8s |

## Límite de Concurrencia

LM Studio (y Ollama, vLLM, etc.) procesan **1 request a la vez** por modelo.

Solución (futuro): implementar **cola de requests** en backend. LM Studio gestiona concurrencia internamente en v1:

```
Request A ──▶ Cola ──▶ LLM ──▶ Respuesta A
Request B ──▶      │       └──▶ Respuesta B
Request C ──▶      └──────────▶ Respuesta C
```

Con cola y response time de 3s, el sistema soporta picos de ~20 requests/minuto sin error.
