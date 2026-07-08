# Rendimiento y Concurrencia

## Setup de Referencia

| Componente | Especificación |
|------------|---------------|
| CPU | AMD Ryzen 7 7800X3D (8C/16T) |
| GPU | AMD Radeon RX 9070 XT 16GB |
| RAM | 32GB DDR5 6000MHz |
| Modelo | Qwen3 8B Q4_K_M |
| Backend | Node.js Express |

## Métricas de Rendimiento

### Latencia por request

| Etapa | Tiempo |
|-------|--------|
| LLM decide acción (decideAction) | ~0.8s |
| Consulta API cliente (OData) | ~0.5-2s |
| LLM genera respuesta (generateReply) | ~1.5-3s |
| **Total por consulta** | **~2.8-5.8s** |

### Throughput

| Escenario | Equipo actual | Equipo recomendado |
|-----------|:-------------:|:------------------:|
| 1 usuario simultáneo | ~3s respuesta | ~3s respuesta |
| 5 simultáneos | ~8s (cola 5s) | ~5s (cola 2s) |
| 10 simultáneos | ~20s (cola 15s) | ~8s (cola 5s) |
| Tokens/segundo (inferencia) | ~50-80 tok/s | ~50-80 tok/s |

### Proyección 200 usuarios/día

- Jornada de 8 horas → ~25 usuarios/hora
- Pico estimado: 5-8 usuarios simultáneos
- Tiempo promedio de respuesta: **4-8 segundos**
- Cola máxima estimada: **10-15 segundos**
- **El cuello de botella real no es el LLM, es la API del cliente**

## Optimizaciones Implementadas

| Optimización | Ahorro |
|-------------|--------|
| Historial limitado a últimos 6 exchanges | ~40% tokens en generateReply |
| System prompt corto (~80 tokens) | Reduce primera llamada |
| `decideAction` con temperature 0.1 | Respuesta rápida y precisa |
| `generateReply` con temperature 0.8 | Respuesta natural |

## Cuello de Botella

```
API Cliente (0.5-2s) → LLM (1.5-3s) → Red (0.1s)
          ↑                ↑
     Depende del      GPU-bound
     cliente
```

**Recomendación:** Si la API del cliente responde en <500ms, el sistema completo responde en <4s.

## Estimación de Tokens por Consulta

| Componente | Input tokens | Output tokens |
|-----------|:-----------:|:-------------:|
| decideAction (system + user) | ~300 | ~50 |
| generateReply (system + history + context + user) | ~800-1200 | ~150-300 |
| **Total por consulta** | **~1100-1500** | **~200-350** |

**Consumo diario (200 consultas):** ~300K tokens → el LLM lo procesa en <5 minutos acumulados de GPU.
