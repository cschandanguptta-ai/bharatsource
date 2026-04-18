/**
 * Tests for Front Matter Generator
 */

const {
  generateFrontMatter,
  generateTitlePage,
  generateCopyrightPage,
  generateDedication,
  generatePreface,
  generateTOC,
} = require('./front-matter');

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

const SAMPLE_CHAPTERS = [
  { num: '1', title: 'अंग्रेज़ी वर्णमाला', titleEn: 'The English Alphabet', type: 'core',  words: 9500 },
  { num: '2', title: 'स्वर',               titleEn: 'Vowels',               type: 'core',  words: 10200 },
  { num: 'B1', title: 'Modal Auxiliaries', titleEn: 'Modal Auxiliaries',    type: 'bonus', words: 7800 },
];

// ─── Test 1: Title page contains required fields ──────────────────────────────
console.log('\nTest 1: generateTitlePage — required fields');
{
  const result = generateTitlePage(SAMPLE_CONFIG);
  assert(result.includes(SAMPLE_CONFIG.bookTitle),    'contains book title');
  assert(result.includes(SAMPLE_CONFIG.bookSubtitle), 'contains subtitle');
  assert(result.includes(SAMPLE_CONFIG.volume),       'contains volume designation');
  assert(result.includes(SAMPLE_CONFIG.cefr),         'contains CEFR level');
  assert(result.includes(SAMPLE_CONFIG.author),       'contains author name');
  assert(result.includes(SAMPLE_CONFIG.edition),      'contains edition');
  assert(result.includes(SAMPLE_CONFIG.publisher),    'contains publisher');
}

// ─── Test 2: Title page starts with page-break marker ────────────────────────
console.log('\nTest 2: generateTitlePage — page-break marker');
{
  const result = generateTitlePage(SAMPLE_CONFIG);
  assert(result.startsWith('---'), 'starts with --- page-break marker');
}

// ─── Test 3: Copyright page contains required fields ─────────────────────────
console.log('\nTest 3: generateCopyrightPage — required fields');
{
  const result = generateCopyrightPage(SAMPLE_CONFIG);
  assert(result.includes(SAMPLE_CONFIG.year),      'contains year');
  assert(result.includes(SAMPLE_CONFIG.author),    'contains author');
  assert(result.includes(SAMPLE_CONFIG.edition),   'contains edition');
  assert(result.includes(SAMPLE_CONFIG.publisher), 'contains publisher');
  assert(result.includes('ISBN'),                  'contains ISBN placeholder');
  assert(result.includes('Copyright'),             'contains copyright notice');
}

// ─── Test 4: Copyright page starts with page-break marker ────────────────────
console.log('\nTest 4: generateCopyrightPage — page-break marker');
{
  const result = generateCopyrightPage(SAMPLE_CONFIG);
  assert(result.startsWith('---'), 'starts with --- page-break marker');
}

// ─── Test 5: Dedication is bilingual ─────────────────────────────────────────
console.log('\nTest 5: generateDedication — bilingual content');
{
  const result = generateDedication(SAMPLE_CONFIG);
  // Should contain Devanagari text
  assert(/[\u0900-\u097F]/.test(result), 'contains Devanagari (Hindi) text');
  // Should contain English text
  assert(/[a-zA-Z]/.test(result),        'contains English text');
  assert(result.includes(SAMPLE_CONFIG.author), 'contains author name');
}

// ─── Test 6: Dedication starts with page-break marker ────────────────────────
console.log('\nTest 6: generateDedication — page-break marker');
{
  const result = generateDedication(SAMPLE_CONFIG);
  assert(result.startsWith('---'), 'starts with --- page-break marker');
}

// ─── Test 7: Preface contains purpose, features, usage ───────────────────────
console.log('\nTest 7: generatePreface — content sections');
{
  const result = generatePreface(SAMPLE_CONFIG);
  assert(result.includes(SAMPLE_CONFIG.bookTitle), 'contains book title');
  assert(result.includes(SAMPLE_CONFIG.volume),    'contains volume');
  assert(result.includes(SAMPLE_CONFIG.cefr),      'contains CEFR level');
  assert(result.includes('Error Lab'),             'mentions Error Lab feature');
  assert(result.includes('Practice'),              'mentions practice exercises');
  // Usage instructions (numbered steps)
  assert(/1\.\s/.test(result), 'contains numbered usage instructions');
}

// ─── Test 8: Preface starts with page-break marker ───────────────────────────
console.log('\nTest 8: generatePreface — page-break marker');
{
  const result = generatePreface(SAMPLE_CONFIG);
  assert(result.startsWith('---'), 'starts with --- page-break marker');
}

// ─── Test 9: TOC lists core and bonus chapters separately ────────────────────
console.log('\nTest 9: generateTOC — core/bonus separation');
{
  const result = generateTOC(SAMPLE_CONFIG, SAMPLE_CHAPTERS);
  assert(result.includes('Core Chapters'),  'has Core Chapters section');
  assert(result.includes('Bonus Chapters'), 'has Bonus Chapters section');
  // Core chapters appear before bonus
  const coreIdx  = result.indexOf('Core Chapters');
  const bonusIdx = result.indexOf('Bonus Chapters');
  assert(coreIdx < bonusIdx, 'core chapters listed before bonus chapters');
}

// ─── Test 10: TOC includes bilingual titles and word counts ──────────────────
console.log('\nTest 10: generateTOC — bilingual titles and word counts');
{
  const result = generateTOC(SAMPLE_CONFIG, SAMPLE_CHAPTERS);
  assert(result.includes('अंग्रेज़ी वर्णमाला'),    'contains Hindi chapter title');
  assert(result.includes('The English Alphabet'), 'contains English chapter title');
  assert(result.includes('9,500'),                'contains word count for chapter 1');
  assert(result.includes('10,200'),               'contains word count for chapter 2');
  assert(result.includes('7,800'),                'contains word count for bonus chapter');
}

// ─── Test 11: TOC shows total word count and chapter count ───────────────────
console.log('\nTest 11: generateTOC — totals');
{
  const result = generateTOC(SAMPLE_CONFIG, SAMPLE_CHAPTERS);
  assert(result.includes('Total Chapters: 3'), 'shows total chapter count');
  // 9500 + 10200 + 7800 = 27500
  assert(result.includes('27,500'), 'shows total word count');
}

// ─── Test 12: TOC starts with page-break marker ──────────────────────────────
console.log('\nTest 12: generateTOC — page-break marker');
{
  const result = generateTOC(SAMPLE_CONFIG, SAMPLE_CHAPTERS);
  assert(result.startsWith('---'), 'starts with --- page-break marker');
}

// ─── Test 13: TOC with no chapters ───────────────────────────────────────────
console.log('\nTest 13: generateTOC — empty chapters');
{
  const result = generateTOC(SAMPLE_CONFIG, []);
  assert(result.includes('Total Chapters: 0'), 'shows 0 chapters');
  assert(!result.includes('Core Chapters'),    'no core section when no core chapters');
  assert(!result.includes('Bonus Chapters'),   'no bonus section when no bonus chapters');
}

// ─── Test 14: TOC with only core chapters ────────────────────────────────────
console.log('\nTest 14: generateTOC — only core chapters');
{
  const coreOnly = SAMPLE_CHAPTERS.filter(c => c.type === 'core');
  const result = generateTOC(SAMPLE_CONFIG, coreOnly);
  assert(result.includes('Core Chapters'),    'has core section');
  assert(!result.includes('Bonus Chapters'),  'no bonus section when no bonus chapters');
}

// ─── Test 15: generateFrontMatter combines all sections ──────────────────────
console.log('\nTest 15: generateFrontMatter — combines all sections');
{
  const result = generateFrontMatter(SAMPLE_CONFIG, SAMPLE_CHAPTERS);
  // All five sections should be present
  assert(result.includes(SAMPLE_CONFIG.bookTitle),    'contains book title (title page)');
  assert(result.includes('Copyright'),                'contains copyright page');
  assert(result.includes('Dedication'),               'contains dedication');
  assert(result.includes('Preface'),                  'contains preface');
  assert(result.includes('Table of Contents'),        'contains TOC');
  // Should have multiple page-break markers
  const breaks = (result.match(/^---$/gm) || []).length;
  assert(breaks >= 5, `has at least 5 page-break markers (got ${breaks})`);
}

// ─── Test 16: generateFrontMatter returns a string ───────────────────────────
console.log('\nTest 16: generateFrontMatter — return type');
{
  const result = generateFrontMatter(SAMPLE_CONFIG, SAMPLE_CHAPTERS);
  assert(typeof result === 'string', 'returns a string');
  assert(result.length > 0,         'returns non-empty string');
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
