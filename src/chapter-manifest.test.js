/**
 * Tests for ChapterManifest
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { ChapterManifest } = require('./chapter-manifest');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

function assertThrows(fn, message) {
  try {
    fn();
    console.error(`  ❌ FAIL: ${message} (expected error, got none)`);
    failed++;
  } catch (e) {
    console.log(`  ✅ PASS: ${message} — threw: ${e.message}`);
    passed++;
  }
}

/** Create a temp directory with placeholder files */
function makeTempDir(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'chapter-manifest-test-'));
  for (const f of files) {
    fs.writeFileSync(path.join(dir, f), '// placeholder');
  }
  return dir;
}

const SAMPLE_MANIFEST = [
  { file: 'v1_ch1_alphabet.js', num: '1', title: 'अंग्रेज़ी वर्णमाला', titleEn: 'The English Alphabet', type: 'core' },
  { file: 'v1_ch2_vowels.js',   num: '2', title: 'स्वर',               titleEn: 'Vowels',               type: 'core' },
  { file: 'v1_bonus1_modal.js', num: 'B1', title: 'Modal Auxiliaries', titleEn: 'Modal Auxiliaries',    type: 'bonus' },
];

// ─── Test 1: Constructor validation ──────────────────────────────────────────
console.log('\nTest 1: Constructor validation');
{
  assertThrows(() => new ChapterManifest(null),     'throws on null');
  assertThrows(() => new ChapterManifest('string'), 'throws on string');
  assertThrows(() => new ChapterManifest({}),       'throws on plain object');
  const m = new ChapterManifest([]);
  assert(m !== null, 'accepts empty array');
  const m2 = new ChapterManifest(SAMPLE_MANIFEST);
  assert(m2 !== null, 'accepts valid manifest array');
}

// ─── Test 2: getOrderedChapters — all files present ──────────────────────────
console.log('\nTest 2: getOrderedChapters — all files present');
{
  const dir = makeTempDir(['v1_ch1_alphabet.js', 'v1_ch2_vowels.js', 'v1_bonus1_modal.js']);
  const manifest = new ChapterManifest(SAMPLE_MANIFEST);
  const result = manifest.getOrderedChapters(dir);
  assert(result.length === 3, 'returns all 3 chapters');
  assert(result[0].file === 'v1_ch1_alphabet.js', 'first chapter is correct');
  assert(result[1].file === 'v1_ch2_vowels.js',   'second chapter is correct');
  assert(result[2].file === 'v1_bonus1_modal.js',  'third chapter is correct');
}

// ─── Test 3: getOrderedChapters — missing file is skipped ────────────────────
console.log('\nTest 3: getOrderedChapters — missing file skipped');
{
  const dir = makeTempDir(['v1_ch1_alphabet.js', 'v1_bonus1_modal.js']); // ch2 missing
  const manifest = new ChapterManifest(SAMPLE_MANIFEST);
  const result = manifest.getOrderedChapters(dir);
  assert(result.length === 2, 'returns 2 chapters (skipped missing)');
  assert(result.every(c => c.file !== 'v1_ch2_vowels.js'), 'missing chapter not in result');
}

// ─── Test 4: getOrderedChapters — warns for missing files ────────────────────
console.log('\nTest 4: getOrderedChapters — warns for missing files');
{
  const dir = makeTempDir(['v1_ch1_alphabet.js']); // ch2 and bonus1 missing
  const manifest = new ChapterManifest(SAMPLE_MANIFEST);

  const warnings = [];
  const origWarn = console.warn;
  console.warn = (...args) => warnings.push(args.join(' '));
  manifest.getOrderedChapters(dir);
  console.warn = origWarn;

  assert(warnings.length === 2, 'logs 2 warnings for 2 missing files');
  assert(warnings[0].includes('v1_ch2_vowels.js'),   'first warning mentions missing file');
  assert(warnings[1].includes('v1_bonus1_modal.js'),  'second warning mentions missing file');
}

// ─── Test 5: getOrderedChapters — no files exist ─────────────────────────────
console.log('\nTest 5: getOrderedChapters — no files exist');
{
  const dir = makeTempDir([]);
  const manifest = new ChapterManifest(SAMPLE_MANIFEST);
  const origWarn = console.warn;
  console.warn = () => {};
  const result = manifest.getOrderedChapters(dir);
  console.warn = origWarn;
  assert(result.length === 0, 'returns empty array when no files exist');
}

// ─── Test 6: getOrderedChapters — empty manifest ─────────────────────────────
console.log('\nTest 6: getOrderedChapters — empty manifest');
{
  const dir = makeTempDir([]);
  const manifest = new ChapterManifest([]);
  const result = manifest.getOrderedChapters(dir);
  assert(result.length === 0, 'returns empty array for empty manifest');
}

// ─── Test 7: getCoreChapters ──────────────────────────────────────────────────
console.log('\nTest 7: getCoreChapters');
{
  const manifest = new ChapterManifest(SAMPLE_MANIFEST);
  const core = manifest.getCoreChapters();
  assert(core.length === 2, 'returns 2 core chapters');
  assert(core.every(c => c.type === 'core'), 'all returned chapters are core type');
}

// ─── Test 8: getBonusChapters ─────────────────────────────────────────────────
console.log('\nTest 8: getBonusChapters');
{
  const manifest = new ChapterManifest(SAMPLE_MANIFEST);
  const bonus = manifest.getBonusChapters();
  assert(bonus.length === 1, 'returns 1 bonus chapter');
  assert(bonus[0].type === 'bonus', 'returned chapter is bonus type');
  assert(bonus[0].num === 'B1', 'bonus chapter has correct num');
}

// ─── Test 9: getAll ───────────────────────────────────────────────────────────
console.log('\nTest 9: getAll');
{
  const manifest = new ChapterManifest(SAMPLE_MANIFEST);
  const all = manifest.getAll();
  assert(all.length === 3, 'returns all 3 chapters');

  // Mutating the returned array should not affect the manifest
  all.push({ file: 'extra.js', num: '99', title: 'Extra', titleEn: 'Extra', type: 'core' });
  assert(manifest.getAll().length === 3, 'getAll returns a copy, not the original');
}

// ─── Test 10: Bilingual metadata preserved ───────────────────────────────────
console.log('\nTest 10: Bilingual metadata preserved');
{
  const dir = makeTempDir(['v1_ch1_alphabet.js']);
  const manifest = new ChapterManifest(SAMPLE_MANIFEST);
  const result = manifest.getOrderedChapters(dir);
  assert(result[0].title === 'अंग्रेज़ी वर्णमाला', 'Hindi title preserved');
  assert(result[0].titleEn === 'The English Alphabet', 'English title preserved');
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
