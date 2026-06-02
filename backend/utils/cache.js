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

module.exports = { get, set, del };
