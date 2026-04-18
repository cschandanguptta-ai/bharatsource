/**
 * Tests for structure-validator.js
 */

const { validateChapter, validateChapters } = require('./structure-validator');

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

// Minimal valid chapter with all required elements
const VALID_CONTENT = `
# अध्याय एक
## Chapter One

## भाग 1: परिचय
### Introduction

Some content here.

## Error Lab
त्रुटि प्रयोगशाला content.

## Practice
अभ्यास exercises here.

| Column A | Column B |
|----------|----------|
| row1a    | row1b    |
| row2a    | row2b    |
`;

// ─── hasErrorLab ──────────────────────────────────────────────────────────────
console.log('\nTest 1: hasErrorLab — detects "Error Lab"');
{
  const result = validateChapter(VALID_CONTENT);
  assert(result.checks.hasErrorLab === true, 'detects "Error Lab" in content');
}

console.log('\nTest 2: hasErrorLab — detects Hindi "त्रुटि प्रयोगशाला"');
{
  const content = `# Title\n## Section\n## त्रुटि प्रयोगशाला\n## Practice\n## अभ्यास\n## Chapter One\n`;
  const result = validateChapter(content);
  assert(result.checks.hasErrorLab === true, 'detects Hindi Error Lab text');
}

console.log('\nTest 3: hasErrorLab — missing Error Lab adds warning');
{
  const content = `# Title\n## Section\n## Practice\n## अभ्यास\n## Chapter One\n`;
  const result = validateChapter(content);
  assert(result.checks.hasErrorLab === false, 'hasErrorLab is false when missing');
  assert(
    result.issues.some(i => i.type === 'missingSection' && i.message.includes('Error Lab')),
    'warning issue added for missing Error Lab'
  );
  assert(
    result.issues.find(i => i.message.includes('Error Lab')).severity === 'warning',
    'missing Error Lab is a warning, not an error'
  );
}

// ─── hasPractice ──────────────────────────────────────────────────────────────
console.log('\nTest 4: hasPractice — detects "Practice"');
{
  const result = validateChapter(VALID_CONTENT);
  assert(result.checks.hasPractice === true, 'detects "Practice" in content');
}

console.log('\nTest 5: hasPractice — detects Hindi "अभ्यास"');
{
  const content = `# Title\n## Section\n## Error Lab\n## अभ्यास\n## Chapter One\n`;
  const result = validateChapter(content);
  assert(result.checks.hasPractice === true, 'detects Hindi Practice text');
}

console.log('\nTest 6: hasPractice — missing Practice adds warning');
{
  const content = `# Title\n## Section\n## Error Lab\n## Chapter One\n`;
  const result = validateChapter(content);
  assert(result.checks.hasPractice === false, 'hasPractice is false when missing');
  assert(
    result.issues.some(i => i.message.includes('Practice')),
    'warning issue added for missing Practice'
  );
}

// ─── hasContrast ──────────────────────────────────────────────────────────────
console.log('\nTest 7: hasContrast — detects adjacent bilingual headers');
{
  const result = validateChapter(VALID_CONTENT);
  assert(result.checks.hasContrast === true, 'detects Devanagari + English adjacent headers');
}

console.log('\nTest 8: hasContrast — English then Devanagari also valid');
{
  const content = `## Chapter One\n## अध्याय एक\n\n## Error Lab\n## Practice\n`;
  const result = validateChapter(content);
  assert(result.checks.hasContrast === true, 'English header followed by Devanagari header counts');
}

console.log('\nTest 9: hasContrast — missing bilingual contrast adds warning');
{
  const content = `## Section One\n## Section Two\n\n## Error Lab\n## Practice\n`;
  const result = validateChapter(content);
  assert(result.checks.hasContrast === false, 'hasContrast is false when no bilingual headers');
  assert(
    result.issues.some(i => i.type === 'missingContrast'),
    'warning issue added for missing contrast'
  );
}

// ─── hasSections ──────────────────────────────────────────────────────────────
console.log('\nTest 10: hasSections — detects ## headings');
{
  const result = validateChapter(VALID_CONTENT);
  assert(result.checks.hasSections === true, 'detects ## section headers');
}

console.log('\nTest 11: hasSections — detects "भाग"');
{
  const content = `# Title\nभाग 1\n\n## Error Lab\n## Practice\n`;
  const result = validateChapter(content);
  assert(result.checks.hasSections === true, 'detects भाग as section marker');
}

console.log('\nTest 12: hasSections — missing sections adds warning');
{
  // Only h1 and h3, no ## and no भाग
  const content = `# Title\n### Subsection\n\nError Lab\nPractice\n`;
  const result = validateChapter(content);
  assert(result.checks.hasSections === false, 'hasSections is false when no ## or भाग');
  assert(
    result.issues.some(i => i.message.includes('section headers')),
    'warning issue added for missing sections'
  );
}

// ─── headingHierarchyValid ────────────────────────────────────────────────────
console.log('\nTest 13: headingHierarchyValid — valid hierarchy (## before ###)');
{
  const result = validateChapter(VALID_CONTENT);
  assert(result.checks.headingHierarchyValid === true, 'valid hierarchy passes');
}

console.log('\nTest 14: headingHierarchyValid — ### before ## is a violation');
{
  const content = `# Title\n### Subsection before any h2\n\n## Section\n\n## Error Lab\n## Practice\n`;
  const result = validateChapter(content);
  assert(result.checks.headingHierarchyValid === false, 'hierarchy violation detected');
  assert(
    result.issues.some(i => i.type === 'headingHierarchy'),
    'headingHierarchy issue added'
  );
  assert(
    result.issues.find(i => i.type === 'headingHierarchy').severity === 'error',
    'hierarchy violation is an error'
  );
  assert(result.passed === false, 'passed is false when hierarchy error exists');
}

// ─── tablesConsistent ─────────────────────────────────────────────────────────
console.log('\nTest 15: tablesConsistent — consistent table passes');
{
  const result = validateChapter(VALID_CONTENT);
  assert(result.checks.tablesConsistent === true, 'consistent table columns pass');
}

console.log('\nTest 16: tablesConsistent — inconsistent columns detected');
{
  const content = `# Title\n## Section\n\n## Error Lab\n## Practice\n\n| A | B |\n|---|---|\n| 1 | 2 | 3 |\n`;
  const result = validateChapter(content);
  assert(result.checks.tablesConsistent === false, 'inconsistent columns detected');
  assert(
    result.issues.some(i => i.type === 'tableConsistency'),
    'tableConsistency issue added'
  );
  assert(
    result.issues.find(i => i.type === 'tableConsistency').severity === 'error',
    'table inconsistency is an error'
  );
  assert(result.passed === false, 'passed is false when table error exists');
}

// ─── passed flag ──────────────────────────────────────────────────────────────
console.log('\nTest 17: passed — true when only warnings (no errors)');
{
  // Content with no Error Lab or Practice (warnings) but valid hierarchy and tables
  const content = `# Title\n## Section\n`;
  const result = validateChapter(content);
  const hasErrors = result.issues.some(i => i.severity === 'error');
  assert(result.passed === !hasErrors, 'passed reflects absence of errors');
}

console.log('\nTest 18: passed — false when errors present');
{
  const content = `# Title\n### Bad hierarchy\n\n## Section\n`;
  const result = validateChapter(content);
  assert(result.passed === false, 'passed is false when errors exist');
}

// ─── edge cases ───────────────────────────────────────────────────────────────
console.log('\nTest 19: edge cases — empty string');
{
  const result = validateChapter('');
  assert(result.passed === false, 'empty content returns passed=false');
  assert(result.issues.length > 0, 'empty content has issues');
}

console.log('\nTest 20: edge cases — null and undefined');
{
  assert(validateChapter(null).passed === false, 'null returns passed=false');
  assert(validateChapter(undefined).passed === false, 'undefined returns passed=false');
}

console.log('\nTest 21: edge cases — all issues have required fields');
{
  const result = validateChapter('# Title\n### Bad\n');
  result.issues.forEach(issue => {
    assert(typeof issue.type === 'string', `issue.type is string: ${issue.type}`);
    assert(typeof issue.message === 'string', `issue.message is string: ${issue.message}`);
    assert(issue.severity === 'error' || issue.severity === 'warning', `issue.severity is valid: ${issue.severity}`);
  });
}

// ─── validateChapters ─────────────────────────────────────────────────────────
console.log('\nTest 22: validateChapters — attaches chapterNum to each result');
{
  const chapters = [
    { num: '1', content: VALID_CONTENT },
    { num: '2', content: '' }
  ];
  const results = validateChapters(chapters);
  assert(results.length === 2, 'returns one result per chapter');
  assert(results[0].chapterNum === '1', 'first result has chapterNum "1"');
  assert(results[1].chapterNum === '2', 'second result has chapterNum "2"');
}

console.log('\nTest 23: validateChapters — each result has passed, issues, checks');
{
  const chapters = [{ num: 1, content: VALID_CONTENT }];
  const results = validateChapters(chapters);
  assert('passed' in results[0], 'result has passed field');
  assert('issues' in results[0], 'result has issues field');
  assert('checks' in results[0], 'result has checks field');
}

console.log('\nTest 24: validateChapters — non-array input returns empty array');
{
  assert(Array.isArray(validateChapters(null)), 'null returns array');
  assert(validateChapters(null).length === 0, 'null returns empty array');
  assert(validateChapters('string').length === 0, 'string returns empty array');
  assert(validateChapters([]).length === 0, 'empty array returns empty array');
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
