/**
 * Tests for Content Repository Manager
 */

const {
  initRepository,
  registerChapter,
  getChapter,
  exportRepository,
  importRepository,
} = require('./content-repository');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`✅ PASS: ${label}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${label}`);
    failed++;
  }
}

// Reset the repository before each logical group
function resetRepo() {
  if (typeof global !== 'undefined') {
    global.LEKHAK_REPOSITORY = {};
  }
  if (typeof window !== 'undefined') {
    window.LEKHAK_REPOSITORY = {};
  }
}

// ── Test 1: initRepository creates the global object ──────────────────────────
console.log('\nTest 1: initRepository');
resetRepo();
if (typeof global !== 'undefined') delete global.LEKHAK_REPOSITORY;
initRepository();
assert(
  typeof (typeof global !== 'undefined' ? global : window).LEKHAK_REPOSITORY === 'object',
  'initRepository creates LEKHAK_REPOSITORY'
);

// ── Test 2: initRepository does not overwrite existing data ───────────────────
console.log('\nTest 2: initRepository preserves existing data');
resetRepo();
(typeof global !== 'undefined' ? global : window).LEKHAK_REPOSITORY = { v1_c1: 'existing' };
initRepository();
assert(
  (typeof global !== 'undefined' ? global : window).LEKHAK_REPOSITORY['v1_c1'] === 'existing',
  'initRepository does not overwrite existing repository'
);

// ── Test 3: registerChapter stores content ────────────────────────────────────
console.log('\nTest 3: registerChapter');
resetRepo();
registerChapter('v1_c1', '# Chapter 1\nContent here.');
assert(
  (typeof global !== 'undefined' ? global : window).LEKHAK_REPOSITORY['v1_c1'] === '# Chapter 1\nContent here.',
  'registerChapter stores content under the given key'
);

// ── Test 4: registerChapter warns on duplicate key ────────────────────────────
console.log('\nTest 4: registerChapter duplicate key warning');
resetRepo();
const warnings = [];
const originalWarn = console.warn;
console.warn = (...args) => warnings.push(args.join(' '));

registerChapter('v1_c1', 'first');
registerChapter('v1_c1', 'second');

console.warn = originalWarn;

assert(warnings.length === 1, 'warns exactly once on duplicate key');
assert(warnings[0].includes('v1_c1'), 'warning message includes the duplicate key');
assert(
  (typeof global !== 'undefined' ? global : window).LEKHAK_REPOSITORY['v1_c1'] === 'second',
  'last registered content wins on duplicate'
);

// ── Test 5: getChapter retrieves content ──────────────────────────────────────
console.log('\nTest 5: getChapter');
resetRepo();
registerChapter('v2_c3', '# Chapter 3');
assert(getChapter('v2_c3') === '# Chapter 3', 'getChapter returns stored content');
assert(getChapter('nonexistent') === undefined, 'getChapter returns undefined for missing key');

// ── Test 6: exportRepository returns JSON string ──────────────────────────────
console.log('\nTest 6: exportRepository');
resetRepo();
registerChapter('v1_c1', 'Content A');
registerChapter('v1_c2', 'Content B');
const exported = exportRepository();
assert(typeof exported === 'string', 'exportRepository returns a string');
const parsed = JSON.parse(exported);
assert(parsed['v1_c1'] === 'Content A', 'exported JSON contains v1_c1');
assert(parsed['v1_c2'] === 'Content B', 'exported JSON contains v1_c2');

// ── Test 7: importRepository loads from JSON ──────────────────────────────────
console.log('\nTest 7: importRepository');
resetRepo();
const json = JSON.stringify({ v3_c1: 'Imported A', v3_c2: 'Imported B' });
importRepository(json);
assert(getChapter('v3_c1') === 'Imported A', 'importRepository loads v3_c1');
assert(getChapter('v3_c2') === 'Imported B', 'importRepository loads v3_c2');

// ── Test 8: importRepository warns on duplicate keys ─────────────────────────
console.log('\nTest 8: importRepository duplicate key warning');
resetRepo();
registerChapter('v1_c1', 'original');
const importWarnings = [];
console.warn = (...args) => importWarnings.push(args.join(' '));
importRepository(JSON.stringify({ v1_c1: 'imported' }));
console.warn = originalWarn;
assert(importWarnings.length === 1, 'importRepository warns on duplicate key');
assert(getChapter('v1_c1') === 'imported', 'imported content overwrites on duplicate');

// ── Test 9: importRepository throws on invalid JSON ───────────────────────────
console.log('\nTest 9: importRepository invalid JSON');
resetRepo();
let threw = false;
try {
  importRepository('not valid json {{{');
} catch (e) {
  threw = true;
  assert(e.message.includes('Failed to parse JSON'), 'error message mentions JSON parse failure');
}
assert(threw, 'importRepository throws on invalid JSON');

// ── Test 10: importRepository throws on non-object JSON ───────────────────────
console.log('\nTest 10: importRepository non-object JSON');
resetRepo();
let threwArray = false;
try {
  importRepository(JSON.stringify([1, 2, 3]));
} catch (e) {
  threwArray = true;
  assert(e.message.includes('plain object'), 'error message mentions plain object requirement');
}
assert(threwArray, 'importRepository throws when JSON is an array');

// ── Test 11: export → import round-trip ───────────────────────────────────────
console.log('\nTest 11: export/import round-trip');
resetRepo();
registerChapter('v1_c1', '# Hello\nWorld');
registerChapter('v1_c2', '# Goodbye\nWorld');
const roundTrip = exportRepository();
resetRepo();
importRepository(roundTrip);
assert(getChapter('v1_c1') === '# Hello\nWorld', 'round-trip preserves v1_c1');
assert(getChapter('v1_c2') === '# Goodbye\nWorld', 'round-trip preserves v1_c2');

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n── Summary: ${passed} passed, ${failed} failed ──`);
if (failed > 0) process.exit(1);
