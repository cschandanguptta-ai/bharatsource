/**
 * Tests for Markdown to HTML Converter
 */

const { markdownToHTML } = require('./markdown-to-html');

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

// ─── Test 1: Headings ─────────────────────────────────────────────────────────
console.log('\nTest 1: Headings');
{
  assert(markdownToHTML('# Hello') === '<h1>Hello</h1>', '# converts to h1');
  assert(markdownToHTML('## Hello') === '<h2>Hello</h2>', '## converts to h2');
  assert(markdownToHTML('### Hello') === '<h3>Hello</h3>', '### converts to h3');
  assert(markdownToHTML('#### Hello') === '<h4>Hello</h4>', '#### converts to h4');
}

// ─── Test 2: Bold and Italic ──────────────────────────────────────────────────
console.log('\nTest 2: Bold and Italic');
{
  assert(markdownToHTML('**bold**') === '<p><strong>bold</strong></p>', '**text** converts to strong');
  assert(markdownToHTML('*italic*') === '<p><em>italic</em></p>', '*text* converts to em');
  assert(markdownToHTML('`code`') === '<p><code>code</code></p>', '`text` converts to code');
}

// ─── Test 3: HTML Entity Escaping ─────────────────────────────────────────────
console.log('\nTest 3: HTML Entity Escaping');
{
  assert(markdownToHTML('a & b') === '<p>a &amp; b</p>', '& escapes to &amp;');
  assert(markdownToHTML('a < b') === '<p>a &lt; b</p>', '< escapes to &lt;');
  // > in plain text (not blockquote) should be escaped
  const gtResult = markdownToHTML('a > b');
  assert(gtResult === '<p>a &gt; b</p>', '> in plain text escapes to &gt;');
}

// ─── Test 4: Blockquotes ──────────────────────────────────────────────────────
console.log('\nTest 4: Blockquotes');
{
  const result = markdownToHTML('> quote text');
  assert(result === '<blockquote><p>quote text</p></blockquote>', '> converts to blockquote');
}

// ─── Test 5: Horizontal Rules ─────────────────────────────────────────────────
console.log('\nTest 5: Horizontal Rules');
{
  const result = markdownToHTML('---');
  assert(result === '<hr class="page-break">', '--- converts to hr.page-break');
}

// ─── Test 6: Unordered Lists ──────────────────────────────────────────────────
console.log('\nTest 6: Unordered Lists');
{
  const result = markdownToHTML('- item one\n- item two');
  assert(result === '<ul><li>item one</li><li>item two</li></ul>', 'consecutive - items wrapped in ul');
}

// ─── Test 7: Ordered Lists ────────────────────────────────────────────────────
console.log('\nTest 7: Ordered Lists');
{
  const result = markdownToHTML('1. first\n2. second');
  assert(result === '<ol><li>first</li><li>second</li></ol>', 'consecutive 1. items wrapped in ol');
}

// ─── Test 8: Tables ───────────────────────────────────────────────────────────
console.log('\nTest 8: Tables');
{
  const md = '| Name | Age |\n|------|-----|\n| Alice | 30 |\n| Bob | 25 |';
  const result = markdownToHTML(md);
  assert(result.includes('<table>'), 'table element present');
  assert(result.includes('<thead>'), 'thead element present');
  assert(result.includes('<tbody>'), 'tbody element present');
  assert(result.includes('<th>Name</th>'), 'header cell Name present');
  assert(result.includes('<th>Age</th>'), 'header cell Age present');
  assert(result.includes('<td>Alice</td>'), 'body cell Alice present');
  assert(result.includes('<td>30</td>'), 'body cell 30 present');
  assert(result.includes('<td>Bob</td>'), 'body cell Bob present');
  assert(result.includes('<td>25</td>'), 'body cell 25 present');
}

// ─── Test 9: Paragraphs ───────────────────────────────────────────────────────
console.log('\nTest 9: Paragraphs');
{
  assert(markdownToHTML('Hello world') === '<p>Hello world</p>', 'plain text wrapped in p');
  const twoParas = markdownToHTML('First paragraph\n\nSecond paragraph');
  assert(twoParas.includes('<p>First paragraph</p>'), 'first paragraph present');
  assert(twoParas.includes('<p>Second paragraph</p>'), 'second paragraph present');
}

// ─── Test 10: Nested Structures ───────────────────────────────────────────────
console.log('\nTest 10: Nested Structures');
{
  const boldInList = markdownToHTML('- **bold** item');
  assert(boldInList === '<ul><li><strong>bold</strong> item</li></ul>', 'bold within list item');

  const codeInTable = markdownToHTML('| Col |\n|-----|\n| `val` |');
  assert(codeInTable.includes('<code>val</code>'), 'code within table cell');

  const boldInHeading = markdownToHTML('## **Bold** Heading');
  assert(boldInHeading === '<h2><strong>Bold</strong> Heading</h2>', 'bold within heading');
}

// ─── Test 11: Escaping happens before other conversions ───────────────────────
console.log('\nTest 11: Escape order — entities escaped before conversion');
{
  // A raw < in a heading should be escaped, not treated as HTML
  const result = markdownToHTML('# a < b');
  assert(result === '<h1>a &lt; b</h1>', 'entities escaped inside heading');
}

// ─── Test 12: Mixed content ───────────────────────────────────────────────────
console.log('\nTest 12: Mixed content');
{
  const md = '# Title\n\nSome paragraph.\n\n- item\n\n---';
  const result = markdownToHTML(md);
  assert(result.includes('<h1>Title</h1>'), 'heading present in mixed content');
  assert(result.includes('<p>Some paragraph.</p>'), 'paragraph present in mixed content');
  assert(result.includes('<ul><li>item</li></ul>'), 'list present in mixed content');
  assert(result.includes('<hr class="page-break">'), 'hr present in mixed content');
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
