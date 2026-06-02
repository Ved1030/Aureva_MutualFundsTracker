class NodeCache {
  constructor({ stdTTL = 0 } = {}) {
    this.store = new Map();
    this.stdTTL = stdTTL;
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (this._isExpired(entry)) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key, value, ttl) {
    const ttlSeconds = ttl ?? this.stdTTL;
    this.store.set(key, {
      value,
      expiry: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null,
    });
    return true;
  }

  del(key) {
    return this.store.delete(key);
  }

  flushAll() {
    this.store.clear();
  }

  keys() {
    return Array.from(this.store.keys());
  }

  has(key) {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (this._isExpired(entry)) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  getStats() {
    return {
      keys: this.store.size,
      hits: 0,
      misses: 0,
    };
  }

  _isExpired(entry) {
    return entry.expiry !== null && Date.now() > entry.expiry;
  }
}

const cache = new NodeCache({ stdTTL: 3600 });

module.exports = cache;
