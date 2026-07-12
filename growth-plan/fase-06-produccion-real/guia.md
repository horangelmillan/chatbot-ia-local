# Guía: Producción Real

## 1. Caché con TTL

```javascript
class TtlCache {
  constructor(ttlMs) {
    this.ttlMs = ttlMs;
    this.store = new Map();
  }
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }
  set(key, value) {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}
```

## 2. Cola de LLM

```javascript
class LlmQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }
  async enqueue(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.processNext();
    });
  }
  async processNext() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    const { fn, resolve, reject } = this.queue.shift();
    try { resolve(await fn()); }
    catch (e) { reject(e); }
    finally {
      this.processing = false;
      this.processNext();
    }
  }
}
```

## 3. Docker multi-etapa

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY backend/package.json .
RUN pnpm install

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY backend/ .
EXPOSE 3001
CMD ["node", "server.js"]
```
