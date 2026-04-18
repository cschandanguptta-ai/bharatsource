/**
 * Tests for word-counter.js
 */

const { countWords, countWordsInChapters, calculateVolumeStats } = require('./word-counter');

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

// ─── countWords ───────────────────────────────────────────────────────────────
console.log('\nTest 1: countWords — basic Latin text');
{
  assert(countWords('hello world') === 2, 'two words separated by space');
  assert(countWords('one two three four') === 4, 'four words');
  assert(countWords('single') === 1, 'single word');
}

console.log('\nTest 2: countWords — whitespace variants');
{
  assert(countWords('a\tb') === 2, 'tab-separated words');
  assert(countWords('a\nb') === 2, 'newline-separated words');
  assert(countWords('a\rb') === 2, 'carriage-return-separated words');
  assert(countWords('a  b') === 2, 'multiple spaces collapsed');
  assert(countWords('  leading and trailing  ') === 3, 'leading/trailing whitespace ignored');
}

console.log('\nTest 3: countWords — empty and edge cases');
{
  assert(countWords('') === 0, 'empty string returns 0');
  assert(countWords('   ') === 0, 'whitespace-only string returns 0');
  assert(countWords(null) === 0, 'null returns 0');
  assert(countWords(undefined) === 0, 'undefined returns 0');
}

console.log('\nTest 4: countWords — Devanagari script');
{
  assert(countWords('नमस्ते दुनिया') === 2, 'two Devanagari words');
  assert(countWords('यह एक परीक्षण है') === 4, 'four Devanagari words');
}

console.log('\nTest 5: countWords — mixed scripts');
{
  assert(countWords('Hello नमस्ते world') === 3, 'mixed Latin and Devanagari');
  assert(countWords('Chapter अध्याय 1') === 3, 'mixed with number');
}

console.log('\nTest 6: countWords — markdown syntax included (no exclusion)');
{
  // Per design.md: "Does not exclude markdown syntax"
  assert(countWords('# Heading') === 2, 'markdown heading counted as-is');
  assert(countWords('**bold** text') === 2, 'bold markers counted as tokens');
  assert(countWords('| col1 | col2 |') === 5, 'table pipes and content counted as tokens');
}

// ─── countWordsInChapters ─────────────────────────────────────────────────────
console.log('\nTest 7: countWordsInChapters — adds words field');
{
  const chapters = [
    { content: 'hello world', num: '1' },
    { content: 'one two three', num: '2' },
  ];
  const result = countWordsInChapters(chapters);
  assert(result[0].words === 2, 'first chapter has correct word count');
  assert(result[1].words === 3, 'second chapter has correct word count');
  assert(result[0].num === '1', 'original fields preserved');
}

console.log('\nTest 8: countWordsInChapters — handles missing content');
{
  const chapters = [{ num: '1' }, { content: '', num: '2' }];
  const result = countWordsInChapters(chapters);
  assert(result[0].words === 0, 'missing content treated as 0');
  assert(result[1].words === 0, 'empty content treated as 0');
}

console.log('\nTest 9: countWordsInChapters — non-array input');
{
  assert(Array.isArray(countWordsInChapters(null)), 'null returns array');
  assert(countWordsInChapters(null).length === 0, 'null returns empty array');
  assert(countWordsInChapters([]).length === 0, 'empty array returns empty array');
}

// ─── calculateVolumeStats ─────────────────────────────────────────────────────
console.log('\nTest 10: calculateVolumeStats — basic stats');
{
  const chapters = [
    { content: 'one two three' },       // 3 words
    { content: 'four five six seven' }, // 4 words
    { content: 'eight nine' },          // 2 words
  ];
  const stats = calculateVolumeStats(chapters);
  assert(stats.totalWords === 9, 'total words correct');
  assert(stats.chapterCount === 3, 'chapter count correct');
  assert(stats.averageWords === 3, 'average words correct (rounded)');
}

console.log('\nTest 11: calculateVolumeStats — empty input');
{
  const stats = calculateVolumeStats([]);
  assert(stats.totalWords === 0, 'empty array: totalWords is 0');
  assert(stats.averageWords === 0, 'empty array: averageWords is 0');
  assert(stats.chapterCount === 0, 'empty array: chapterCount is 0');

  const statsNull = calculateVolumeStats(null);
  assert(statsNull.totalWords === 0, 'null: totalWords is 0');
}

console.log('\nTest 12: calculateVolumeStats — single chapter');
{
  const stats = calculateVolumeStats([{ content: 'hello world' }]);
  assert(stats.totalWords === 2, 'single chapter: totalWords correct');
  assert(stats.chapterCount === 1, 'single chapter: chapterCount is 1');
  assert(stats.averageWords === 2, 'single chapter: averageWords equals totalWords');
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
