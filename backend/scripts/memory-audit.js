const cache = require('../utils/cache');
const { performance } = require('perf_hooks');

function toMB(bytes) {
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function formatNumber(n) {
  return n.toLocaleString();
}

console.log('='.repeat(60));
console.log('  AUREVA BACKEND — MEMORY AUDIT');
console.log('='.repeat(60));

// ── Phase 1: Baseline ──────────────────────────────────────────────
const baseline = process.memoryUsage();
console.log('\n--- Phase 1: Baseline (after Node.js startup, before cache) ---');
console.log(`  RSS:          ${toMB(baseline.rss)}`);
console.log(`  Heap Total:   ${toMB(baseline.heapTotal)}`);
console.log(`  Heap Used:    ${toMB(baseline.heapUsed)}`);
console.log(`  External:     ${toMB(baseline.external)}`);

const baselineHeapUsed = baseline.heapUsed;

// ── Phase 2: Load cache & store 40k deduped entries ────────────────
console.log('\n--- Phase 2: Loading cache + 40 000 deduped entries ---');

const COUNT = 40_000;
const schemes = [];

for (let i = 0; i < COUNT; i++) {
  const code = String(100000 + i).padStart(6, '0');
  schemes.push({
    schemeCode: code,
    schemeName: `Test Fund ${i} - Growth Option`,
  });
}

const key = 'mfapi:scheme-list';
cache.set(key, schemes);

const afterStore = process.memoryUsage();
const heapUsedAfterStore = afterStore.heapUsed;

const rawSize = JSON.stringify(schemes);
const cacheSizeKB = (rawSize.length / 1024).toFixed(2);

console.log(`  Cache key:             ${key}`);
console.log(`  Entries stored:        ${formatNumber(COUNT)}`);
console.log(`  Raw JSON size:         ${cacheSizeKB} KB`);
console.log(`  Heap Used (after):     ${toMB(afterStore.heapUsed)}`);
console.log(`  Heap Delta (store):    ${toMB(heapUsedAfterStore - baselineHeapUsed)}`);
console.log(`  RSS (after):           ${toMB(afterStore.rss)}`);

// ── Phase 3: Read from cache (simulate API hit) ────────────────────
console.log('\n--- Phase 3: Read from cache ---');

const readStart = process.hrtime.bigint();
const data = cache.get(key);
const readEnd = process.hrtime.bigint();
const readDuration = Number(readEnd - readStart) / 1e6;

const afterRead = process.memoryUsage();

console.log(`  Read success:          ${Array.isArray(data) && data.length === COUNT}`);
console.log(`  Read duration:         ${readDuration.toFixed(4)} ms`);
console.log(`  Heap Used (after):     ${toMB(afterRead.heapUsed)}`);

// ── Phase 4: Simulate original (non-deduped) approach ──────────────
console.log('\n--- Phase 4: Simulating original (non-deduped) approach ---');

const rawEntries = [];
const rawEntriesSizeEstimate = [];
for (let i = 0; i < COUNT; i++) {
  const entry = {
    schemeCode: String(100000 + i).padStart(6, '0'),
    schemeName: `Test Fund ${i} - Growth Option`,
    isinDivPayout: 'INF123K' + String(i).padStart(4, '0'),
    isinGrowth: 'INF456K' + String(i).padStart(4, '0'),
    amc: 'Test AMC',
    amfiCode: String(120000 + i),
    nav: (10 + Math.random() * 200).toFixed(4),
    date: new Date().toISOString().slice(0, 10),
  };
  rawEntries.push(entry);
}
const rawSizeJSON = JSON.stringify(rawEntries);
const rawSizeKB = (rawSizeJSON.length / 1024).toFixed(2);

const dedupedJSON = JSON.stringify(schemes);
const dedupedKB = (dedupedJSON.length / 1024).toFixed(2);

const savings = (rawSizeJSON.length - dedupedJSON.length) / rawSizeJSON.length * 100;

console.log(`  Raw (MFAPI) entries:   ${formatNumber(rawEntries.length)}`);
console.log(`  Raw JSON size:         ${rawSizeKB} KB`);
console.log(`  Deduped JSON size:     ${dedupedKB} KB`);
console.log(`  Memory saved:          ${savings.toFixed(1)}%`);
console.log(`  Savings in KB:         ${(rawSizeKB - dedupedKB).toFixed(2)} KB`);

// ── Phase 5: Delete from cache ─────────────────────────────────────
console.log('\n--- Phase 5: Clear cache ---');

cache.del(key);

const afterDelete = process.memoryUsage();
console.log(`  Cache has key?         ${cache.get(key) !== undefined}`);
console.log(`  Heap Used (after):     ${toMB(afterDelete.heapUsed)}`);
console.log(`  Heap Delta (cleanup):  ${toMB(afterDelete.heapUsed - afterStore.heapUsed)}`);

// ── Summary ────────────────────────────────────────────────────────
console.log('\n--- Summary ---');
console.log(`  Baseline Heap Used:     ${toMB(baselineHeapUsed)}`);
console.log(`  Peak Heap Used:         ${toMB(heapUsedAfterStore)}`);
console.log(`  Cache data size:        ${cacheSizeKB} KB`);
console.log(`  Original approach:      ${rawSizeKB} KB`);
console.log(`  Compressed savings:     ${savings.toFixed(1)}%`);
console.log('='.repeat(60));
console.log('  AUDIT COMPLETE');
console.log('='.repeat(60));
