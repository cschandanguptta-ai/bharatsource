/**
 * Tests for Markdown Extraction Engine
 */

const { extractMarkdown } = require('./markdown-extractor');

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

// ─── Test 1: Primary pattern LEKHAK_REPOSITORY["key"] = ` ───────────────────
console.log('\nTest 1: LEKHAK_REPOSITORY["key"] = ` pattern');
{
  const js = `
if (typeof window !== 'undefined') {
  window.LEKHAK_REPOSITORY = window.LEKHAK_REPOSITORY || {};
}
window.LEKHAK_REPOSITORY["v1_c1"] = \`
# Chapter One
Hello world
\`;
`;
  const result = extractMarkdown(js);
  assert(result.includes('# Chapter One'), 'extracts heading');
  assert(result.includes('Hello world'), 'extracts body text');
  assert(!result.startsWith('`'), 'does not include opening backtick');
  assert(!result.endsWith('`'), 'does not include closing backtick');
}

// ─── Test 2: Single-quoted key ───────────────────────────────────────────────
console.log("\nTest 2: LEKHAK_REPOSITORY['key'] = ` pattern");
{
  const js = `window.LEKHAK_REPOSITORY['v2_c3'] = \`# Title\nContent here\n\`;`;
  const result = extractMarkdown(js);
  assert(result.includes('# Title'), 'extracts with single-quoted key');
}

// ─── Test 3: Fallback .content = ` pattern ──────────────────────────────────
console.log('\nTest 3: .content = ` fallback pattern');
{
  const js = `const chapter = {};\nchapter.content = \`# Fallback\nFallback content\n\`;`;
  const result = extractMarkdown(js);
  assert(result.includes('# Fallback'), 'extracts via .content fallback');
}

// ─── Test 4: Largest block fallback (> 1000 chars) ──────────────────────────
console.log('\nTest 4: Largest template literal fallback');
{
  const longContent = '# Big Chapter\n' + 'word '.repeat(300); // > 1000 chars
  const js = `const small = \`tiny\`;\nconst big = \`${longContent}\`;`;
  const result = extractMarkdown(js);
  assert(result.includes('# Big Chapter'), 'extracts largest block');
  assert(result.length > 1000, 'extracted block is > 1000 chars');
}

// ─── Test 5: Escaped backticks inside content ────────────────────────────────
console.log('\nTest 5: Escaped backticks within content');
{
  const js = `window.LEKHAK_REPOSITORY["v1_c1"] = \`Use \\\`backtick\\\` in code\n\`;`;
  const result = extractMarkdown(js);
  assert(result.includes('\\`backtick\\`'), 'preserves escaped backticks');
}

// ─── Test 6: Whitespace and line breaks preserved ────────────────────────────
console.log('\nTest 6: Whitespace and special characters preserved');
{
  const content = '\n# Title\n\nParagraph one.\n\nParagraph two.\n\n- item 1\n- item 2\n';
  const js = `window.LEKHAK_REPOSITORY["v1_c1"] = \`${content}\`;`;
  const result = extractMarkdown(js);
  assert(result === content, 'preserves exact whitespace and line breaks');
}

// ─── Test 7: Unicode / Devanagari content ────────────────────────────────────
console.log('\nTest 7: Unicode / Devanagari content');
{
  const js = `window.LEKHAK_REPOSITORY["v1_c1"] = \`# अंग्रेज़ी वर्णमाला\n## The English Alphabet\n\`;`;
  const result = extractMarkdown(js);
  assert(result.includes('अंग्रेज़ी वर्णमाला'), 'preserves Devanagari script');
}

// ─── Test 8: Error thrown when no template literal found ─────────────────────
console.log('\nTest 8: Error thrown when extraction fails');
{
  assertThrows(
    () => extractMarkdown('const x = 1; // no template literals here'),
    'throws when no template literal found'
  );
  assertThrows(
    () => extractMarkdown('const small = `tiny`;'),
    'throws when only block < 1000 chars and no known pattern'
  );
}

// ─── Test 9: Error message includes file name ────────────────────────────────
console.log('\nTest 9: Error message includes file name');
{
  try {
    extractMarkdown('const x = 1;', 'v1_ch1_test.js');
    assert(false, 'should have thrown');
  } catch (e) {
    assert(e.message.includes('v1_ch1_test.js'), 'error message includes file name');
  }
}

// ─── Test 10: Multiple template literals — picks primary pattern ─────────────
console.log('\nTest 10: Multiple template literals — primary pattern wins');
{
  const mainContent = '# Main Chapter\n' + 'word '.repeat(50);
  const js = `
const helper = \`small helper text\`;
window.LEKHAK_REPOSITORY["v1_c1"] = \`${mainContent}\`;
`;
  const result = extractMarkdown(js);
  assert(result.includes('# Main Chapter'), 'extracts the LEKHAK_REPOSITORY block, not the small one');
}

// ─── Test 11: Invalid input type ─────────────────────────────────────────────
console.log('\nTest 11: Invalid input type');
{
  assertThrows(() => extractMarkdown(null), 'throws on null input');
  assertThrows(() => extractMarkdown(42), 'throws on number input');
}

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
