const store = new Map();

function get(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (entry.expiry !== null && Date.now() > entry.expiry) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

function set(key, value, ttl) {
  store.set(key, {
    value,
    expiry: ttl > 0 ? Date.now() + ttl * 1000 : null,
  });
}

function del(key) {
  store.delete(key);
}

function getStats() {
  const mem = process.memoryUsage();
  let totalSizeKB = 0;
  for (const [, entry] of store) {
    try {
      totalSizeKB += Math.round(JSON.stringify(entry.value).length / 1024);
    } catch {}
  }
  return {
    keys: store.size,
    totalSizeKB,
    totalSizeMB: (totalSizeKB / 1024).toFixed(1),
    heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
    rssMB: Math.round(mem.rss / 1024 / 1024),
  };
}

module.exports = { get, set, del, getStats };
