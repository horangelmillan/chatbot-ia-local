# Hardware para Producción

## Resumen

El modelo Qwen3 8B en cuantización Q4_K_M ocupa ~5GB de VRAM.
**El factor determinante no es el CPU ni la RAM, es la VRAM de la GPU.**

## Recomendaciones por Nivel

### 🥉 Nivel Económico (~$1,200 USD)

| Componente | Modelo | Costo |
|-----------|--------|:-----:|
| GPU | NVIDIA RTX 4060 Ti 8GB | $400 |
| CPU | Intel i5-13400F o AMD Ryzen 5 7600 | $200 |
| RAM | 32GB DDR4/DDR5 | $80 |
| SSD | 1TB NVMe | $60 |
| Fuente | 650W 80+ Gold | $80 |
| Gabinete | Genérico | $40 |
| Ensamble | — | $100 |
| **Total** | | **~$960** |

> **Rendimiento:** ~25-35 tok/s, ideal para 1-3 usuarios simultáneos

### 🥈 Nivel Recomendado (~$2,500 USD) — **EL SWEET SPOT**

| Componente | Modelo | Costo |
|-----------|--------|:-----:|
| GPU | NVIDIA RTX 4090 24GB o RX 9070 XT 16GB | $1,200 |
| CPU | AMD Ryzen 7 7800X3D o Intel i7-14700K | $450 |
| RAM | 32GB DDR5 6000MHz | $100 |
| SSD | 2TB PCIe 5.0 NVMe | $200 |
| Fuente | 1000W 80+ Gold | $150 |
| Gabinete + Cooling | Mid Tower + AIO 360mm | $200 |
| **Total** | | **~$2,500** |

> **Rendimiento:** ~50-80 tok/s, soporta 5-8 usuarios simultáneos sin degradación

### 🥇 Nivel Producción (~$5,000+ USD)

| Componente | Modelo | Costo |
|-----------|--------|:-----:|
| GPU | 2x NVIDIA RTX 4090 24GB o 1x A5000 48GB | $3,000+ |
| CPU | AMD Threadripper o Intel Xeon W | $1,000 |
| RAM | 64-128GB DDR5 ECC | $400 |
| SSD | 2TB NVMe | $200 |
| Fuente | 1600W 80+ Titanium | $400 |
| **Total** | | **~$5,500+** |

> **Rendimiento:** Soportaría modelos 32B-70B o Qwen3 8B con >20 usuarios simultáneos

### 🏢 Opción Servidor Dedicado (Hosting)

| Proveedor | GPU | VRAM | Precio/mes |
|-----------|-----|:----:|:----------:|
| GigaGPU | RTX 4090 | 24GB | ~$200 |
| GigaGPU | RTX 5090 | 32GB | ~$350 |
| RunPod | RTX 4090 | 24GB | ~$0.34/hr (~$250/mes) |
| Vast.ai | RTX 4090 | 24GB | ~$0.30/hr (~$220/mes) |
| Leadergpu | RTX 4090 | 24GB | ~$0.40/hr (~$290/mes) |

> **Importante:** Una GPU de servidor dedicado conviene económico si se usa 24/7.
> Para este proyecto (uso diurno, 8-12h), sale más rentable comprar el equipo.

## Comparativa Costo/Beneficio

```
Inversión inicial: $2,500 (equipo)  vs  $0 (servidor cloud/mes)
Costo 3 años:     $2,500           vs  $7,200 (servidor a $200/mes)
```

## Consumo Eléctrico Estimado

| Equipo | Consumo | Costo mensual (8h/día) |
|--------|:-------:|:----------------------:|
| RX 9070 XT (idle + load) | ~250W promedio | ~$8 USD |
| RTX 4090 (idle + load) | ~300W promedio | ~$10 USD |

## Requisitos Mínimos Absolutos (Solo CPU)

Si no hay GPU disponible, el sistema funciona **exclusivamente en CPU**:

| Especificación | Mínimo |
|---------------|:------:|
| CPU | 8 núcleos, 3GHz+ |
| RAM | 32GB |
| Respuesta | ~20-40 segundos por consulta |
| Concurrencia | 1 usuario a la vez |
