/**
 * Tests for Back Matter Generator
 */

const {
  generateBackMatter,
  generateAfterword,
  generateAuthorBio,
  generateCopyrightFooter,
} = require('./back-matter');

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

const SAMPLE_CONFIG = {
  author: 'Ravi Sharma',
  bookTitle: 'अंग्रेज़ी सीखें',
  bookSubtitle: 'Learn English the Smart Way',
  volume: 'Volume 1: Foundation',
  edition: 'First Edition, 2026',
  publisher: 'Lekhak Publications',
  cefr: 'A1–A2',
  year: '2026',
};

// ─── Test 1: Afterword contains required fields ───────────────────────────────
console.log('\nTest 1: generateAfterword — required fields');
{
  const result = generateAfterword(SAMPLE_CONFIG);
  assert(result.includes(SAMPLE_CONFIG.bookTitle), 'contains book title');
  assert(result.includes(SAMPLE_CONFIG.volume),    'contains volume designation');
  assert(result.includes(SAMPLE_CONFIG.cefr),      'contains CEFR level');
}

// ─── Test 2: Afterword starts with page-break marker ─────────────────────────
console.log('\nTest 2: generateAfterword — page-break marker');
{
  const result = generateAfterword(SAMPLE_CONFIG);
  assert(result.startsWith('---'), 'starts with --- page-break marker');
}

// ─── Test 3: Afterword mentions what was learned and next volume ──────────────
console.log('\nTest 3: generateAfterword — summary and preview content');
{
  const result = generateAfterword(SAMPLE_CONFIG);
  assert(result.toLowerCase().includes('learned') || result.toLowerCase().includes('learnt'),
    'mentions what was learned');
  assert(result.toLowerCase().includes('next'), 'previews next volume');
}

// ─── Test 4: Afterword is bilingual ──────────────────────────────────────────
console.log('\nTest 4: generateAfterword — bilingual content');
{
  const result = generateAfterword(SAMPLE_CONFIG);
  assert(/[\u0900-\u097F]/.test(result), 'contains Devanagari (Hindi) text');
  assert(/[a-zA-Z]/.test(result),        'contains English text');
}

// ─── Test 5: Author bio contains required fields ─────────────────────────────
console.log('\nTest 5: generateAuthorBio — required fields');
{
  const result = generateAuthorBio(SAMPLE_CONFIG);
  assert(result.includes(SAMPLE_CONFIG.author),    'contains author name');
  assert(result.includes(SAMPLE_CONFIG.publisher), 'contains publisher name');
}

// ─── Test 6: Author bio starts with page-break marker ────────────────────────
console.log('\nTest 6: generateAuthorBio — page-break marker');
{
  const result = generateAuthorBio(SAMPLE_CONFIG);
  assert(result.startsWith('---'), 'starts with --- page-break marker');
}

// ─── Test 7: Author bio is bilingual ─────────────────────────────────────────
console.log('\nTest 7: generateAuthorBio — bilingual content');
{
  const result = generateAuthorBio(SAMPLE_CONFIG);
  assert(/[\u0900-\u097F]/.test(result), 'contains Devanagari (Hindi) text');
  assert(/[a-zA-Z]/.test(result),        'contains English text');
}

// ─── Test 8: Copyright footer contains required fields ───────────────────────
console.log('\nTest 8: generateCopyrightFooter — required fields');
{
  const result = generateCopyrightFooter(SAMPLE_CONFIG);
  assert(result.includes(SAMPLE_CONFIG.author),    'contains author name');
  assert(result.includes(SAMPLE_CONFIG.year),      'contains year');
  assert(result.includes(SAMPLE_CONFIG.publisher), 'contains publisher name');
  assert(result.includes('Copyright'),             'contains copyright notice');
}

// ─── Test 9: Copyright footer starts with page-break marker ──────────────────
console.log('\nTest 9: generateCopyrightFooter — page-break marker');
{
  const result = generateCopyrightFooter(SAMPLE_CONFIG);
  assert(result.startsWith('---'), 'starts with --- page-break marker');
}

// ─── Test 10: generateBackMatter combines all three sections ─────────────────
console.log('\nTest 10: generateBackMatter — combines all sections');
{
  const result = generateBackMatter(SAMPLE_CONFIG);
  assert(result.includes('Afterword'),             'contains afterword section');
  assert(result.includes('About the Author'),      'contains author bio section');
  assert(result.includes('Copyright'),             'contains copyright footer');
  // Should have at least 3 page-break markers (one per section)
  const breaks = (result.match(/^---$/gm) || []).length;
  assert(breaks >= 3, `has at least 3 page-break markers (got ${breaks})`);
}

// ─── Test 11: generateBackMatter returns a string ────────────────────────────
console.log('\nTest 11: generateBackMatter — return type');
{
  const result = generateBackMatter(SAMPLE_CONFIG);
  assert(typeof result === 'string', 'returns a string');
  assert(result.length > 0,         'returns non-empty string');
}

// ─── Test 12: All sections reflect config values ─────────────────────────────
console.log('\nTest 12: generateBackMatter — config values reflected');
{
  const customConfig = {
    author: 'Priya Patel',
    bookTitle: 'English Mastery',
    bookSubtitle: 'Advanced Course',
    volume: 'Volume 2: Intermediate',
    edition: 'Second Edition, 2027',
    publisher: 'Vidya Press',
    cefr: 'B1–B2',
    year: '2027',
  };
  const result = generateBackMatter(customConfig);
  assert(result.includes('Priya Patel'),  'reflects custom author');
  assert(result.includes('Vidya Press'),  'reflects custom publisher');
  assert(result.includes('2027'),         'reflects custom year');
  assert(result.includes('B1–B2'),        'reflects custom CEFR level');
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
