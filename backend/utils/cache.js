class NodeCache {
  constructor({ stdTTL = 0, maxKeys = 100 } = {}) {
    this.store = new Map();
    this.stdTTL = stdTTL;
    this.maxKeys = maxKeys;
    this.hits = 0;
    this.misses = 0;
    this.insertOrder = [];

    this._cleanupInterval = setInterval(() => this._purgeExpired(), 5 * 60 * 1000);
    this._cleanupInterval.unref();
  }

  _purgeExpired() {
    const now = Date.now();
    let purged = 0;
    for (const [key, entry] of this.store) {
      if (entry.expiry !== null && now > entry.expiry) {
        this.store.delete(key);
        purged++;
      }
    }
    if (purged > 0) {
      this.insertOrder = this.insertOrder.filter(k => this.store.has(k));
      console.log(`[CACHE] Purged ${purged} expired entries (${this.store.size} remaining)`);
    }
  }

  _enforceMaxKeys() {
    while (this.store.size > this.maxKeys) {
      const oldest = this.insertOrder.shift();
      if (oldest) {
        const entry = this.store.get(oldest);
        this.store.delete(oldest);
        console.log(`[CACHE] Evicted "${oldest}" (${this._sizeOf(entry?.value)}KB) — at max ${this.maxKeys} keys`);
      } else {
        break;
      }
    }
  }

  _sizeOf(value) {
    if (!value) return 0;
    try {
      const str = typeof value === 'string' ? value : JSON.stringify(value);
      return Math.round(str.length / 1024);
    } catch {
      return -1;
    }
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return undefined;
    }
    if (this._isExpired(entry)) {
      this.store.delete(key);
      this.misses++;
      return undefined;
    }
    this.hits++;
    return entry.value;
  }

  set(key, value, ttl) {
    if (this.store.has(key)) {
      const idx = this.insertOrder.indexOf(key);
      if (idx > -1) this.insertOrder.splice(idx, 1);
    }

    const ttlSeconds = ttl ?? this.stdTTL;
    this.store.set(key, {
      value,
      expiry: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null,
      sizeKB: this._sizeOf(value),
    });

    this.insertOrder.push(key);
    this._enforceMaxKeys();
    return true;
  }

  del(key) {
    const idx = this.insertOrder.indexOf(key);
    if (idx > -1) this.insertOrder.splice(idx, 1);
    return this.store.delete(key);
  }

  flushAll() {
    this.store.clear();
    this.insertOrder = [];
    this.hits = 0;
    this.misses = 0;
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
    const total = this.hits + this.misses;
    let totalSizeKB = 0;
    for (const [, entry] of this.store) {
      if (entry.sizeKB > 0) totalSizeKB += entry.sizeKB;
    }
    return {
      keys: this.store.size,
      maxKeys: this.maxKeys,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total * 100).toFixed(1) + '%' : 'N/A',
      totalSizeKB,
      totalSizeMB: (totalSizeKB / 1024).toFixed(1),
    };
  }

  _isExpired(entry) {
    return entry.expiry !== null && Date.now() > entry.expiry;
  }
}

const cache = new NodeCache({ stdTTL: 3600, maxKeys: 100 });

module.exports = cache;
