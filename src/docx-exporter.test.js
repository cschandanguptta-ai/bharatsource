/**
 * DOCX Exporter Tests
 * Tests for DOCX (Microsoft Word) export functionality.
 */

const fs = require('fs');
const path = require('path');
const {
  exportToDOCX,
  exportChapterToDOCX,
  generateContentTypes,
  generateRootRels,
  generateDocumentRels,
  generateDocumentXML,
  generateStylesXML,
  generateFontTableXML,
  generateSettingsXML,
  generateWebSettingsXML,
  parseContentToParagraphs,
  generateParagraphXML,
  createDOCXStructure,
} = require('./docx-exporter');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${err.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'Assertion failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertContains(str, substring, message) {
  if (!str || !str.includes(substring)) {
    throw new Error(`${message || 'Assertion failed'}: expected string to contain ${JSON.stringify(substring)}`);
  }
}

function assertTrue(value, message) {
  if (!value) {
    throw new Error(`${message || 'Assertion failed'}: expected true`);
  }
}

// Test generateContentTypes
test('generateContentTypes returns valid XML', () => {
  const contentTypes = generateContentTypes();
  assertContains(contentTypes, '<?xml version="1.0"', 'XML declaration');
  assertContains(contentTypes, 'Types xmlns', 'Types element');
  assertContains(contentTypes, 'word/document.xml', 'document content type');
  assertContains(contentTypes, 'application/vnd.openxmlformats-officedocument.wordprocessingml', 'word media type');
});

// Test generateRootRels
test('generateRootRels creates valid relationships', () => {
  const rels = generateRootRels();
  assertContains(rels, '<?xml version="1.0"', 'XML declaration');
  assertContains(rels, 'Relationships xmlns', 'Relationships element');
  assertContains(rels, 'officeDocument', 'officeDocument relationship');
  assertContains(rels, 'word/document.xml', 'target');
});

// Test generateDocumentRels
test('generateDocumentRels creates valid document relationships', () => {
  const rels = generateDocumentRels();
  assertContains(rels, 'styles.xml', 'styles relationship');
  assertContains(rels, 'fontTable.xml', 'fontTable relationship');
  assertContains(rels, 'settings.xml', 'settings relationship');
  assertContains(rels, 'webSettings.xml', 'webSettings relationship');
});

// Test generateDocumentXML
test('generateDocumentXML creates valid document', () => {
  const config = {
    bookTitle: 'Test Book',
    author: 'Test Author',
  };
  const chapters = [
    { num: '1', title: 'Chapter One', titleEn: 'Chapter One', content: 'Test content.', words: 100 },
  ];

  const doc = generateDocumentXML(config, chapters);
  assertContains(doc, '<?xml version="1.0"', 'XML declaration');
  assertContains(doc, 'w:document', 'document element');
  assertContains(doc, 'w:body', 'body element');
  assertContains(doc, 'Test Book', 'book title');
  assertContains(doc, 'Test Author', 'author');
  assertContains(doc, 'Chapter 1: Chapter One', 'chapter title');
});

// Test generateStylesXML
test('generateStylesXML creates valid styles', () => {
  const styles = generateStylesXML();
  assertContains(styles, '<?xml version="1.0"', 'XML declaration');
  assertContains(styles, 'w:styles', 'styles element');
  assertContains(styles, 'Title', 'Title style');
  assertContains(styles, 'Heading1', 'Heading1 style');
  assertContains(styles, 'Normal', 'Normal style');
  assertContains(styles, 'w:rFonts', 'font definitions');
});

// Test generateFontTableXML
test('generateFontTableXML creates valid font table', () => {
  const fonts = generateFontTableXML();
  assertContains(fonts, '<?xml version="1.0"', 'XML declaration');
  assertContains(fonts, 'w:fonts', 'fonts element');
  assertContains(fonts, 'Times New Roman', 'Times New Roman font');
  assertContains(fonts, 'Arial', 'Arial font');
});

// Test generateSettingsXML
test('generateSettingsXML creates valid settings', () => {
  const settings = generateSettingsXML();
  assertContains(settings, '<?xml version="1.0"', 'XML declaration');
  assertContains(settings, 'w:settings', 'settings element');
  assertContains(settings, 'w:zoom', 'zoom setting');
  assertContains(settings, 'w:defaultTabStop', 'default tab stop');
});

// Test generateWebSettingsXML
test('generateWebSettingsXML creates valid web settings', () => {
  const webSettings = generateWebSettingsXML();
  assertContains(webSettings, '<?xml version="1.0"', 'XML declaration');
  assertContains(webSettings, 'w:webSettings', 'webSettings element');
});

// Test parseContentToParagraphs - basic content
test('parseContentToParagraphs handles basic content', () => {
  const content = 'This is a paragraph.\n\nThis is another paragraph.';
  const paragraphs = parseContentToParagraphs(content);

  assertTrue(paragraphs.length >= 1, 'has paragraphs');
});

// Test parseContentToParagraphs - headings
test('parseContentToParagraphs parses headings', () => {
  const content = '# Heading 1\n\n## Heading 2\n\n### Heading 3';
  const paragraphs = parseContentToParagraphs(content);

  const h1 = paragraphs.find(p => p.isHeading && p.headingLevel === 1);
  const h2 = paragraphs.find(p => p.isHeading && p.headingLevel === 2);
  const h3 = paragraphs.find(p => p.isHeading && p.headingLevel === 3);

  assertTrue(!!h1, 'has h1');
  assertTrue(!!h2, 'has h2');
  assertTrue(!!h3, 'has h3');
  assertEqual(h1.runs[0].text, 'Heading 1', 'h1 text');
  assertEqual(h2.runs[0].text, 'Heading 2', 'h2 text');
  assertEqual(h3.runs[0].text, 'Heading 3', 'h3 text');
});

// Test parseContentToParagraphs - bold and italic
test('parseContentToParagraphs parses bold and italic', () => {
  const content = 'This is **bold** and *italic* text.';
  const paragraphs = parseContentToParagraphs(content);

  assertTrue(paragraphs.length >= 1, 'has paragraph');
  const runs = paragraphs[0].runs;
  const boldRun = runs.find(r => r.bold);
  const italicRun = runs.find(r => r.italic);

  assertTrue(!!boldRun, 'has bold run');
  assertTrue(!!italicRun, 'has italic run');
  assertEqual(boldRun.text, 'bold', 'bold text');
  assertEqual(italicRun.text, 'italic', 'italic text');
});

// Test parseContentToParagraphs - tables
test('parseContentToParagraphs parses tables', () => {
  const content = '| Column 1 | Column 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |';
  const paragraphs = parseContentToParagraphs(content);

  const table = paragraphs.find(p => p.isTable);
  assertTrue(!!table, 'has table');
  assertTrue(table.rows.length >= 2, 'has rows');
  assertEqual(table.rows[0][0], 'Column 1', 'header cell 1');
  assertEqual(table.rows[1][0], 'Cell 1', 'data cell 1');
});

// Test parseContentToParagraphs - page breaks
test('parseContentToParagraphs handles page breaks', () => {
  const content = 'Page 1 content\n\n---\n\nPage 2 content';
  const paragraphs = parseContentToParagraphs(content);

  const pageBreak = paragraphs.find(p => p.breakType === 'page');
  assertTrue(!!pageBreak, 'has page break');
});

// Test generateParagraphXML - regular paragraph
test('generateParagraphXML creates regular paragraph', () => {
  const paragraph = {
    runs: [{ text: 'Test paragraph' }]
  };
  const xml = generateParagraphXML(paragraph);

  assertContains(xml, 'w:p', 'paragraph element');
  assertContains(xml, 'w:t', 'text element');
  assertContains(xml, 'Test paragraph', 'text content');
});

// Test generateParagraphXML - heading
test('generateParagraphXML creates heading', () => {
  const paragraph = {
    isHeading: true,
    headingLevel: 1,
    runs: [{ text: 'My Heading', bold: true }]
  };
  const xml = generateParagraphXML(paragraph);

  assertContains(xml, 'w:p', 'paragraph element');
  assertContains(xml, 'Heading1', 'heading style');
  assertContains(xml, 'My Heading', 'heading text');
  assertContains(xml, 'w:b', 'bold');
});

// Test generateParagraphXML - page break
test('generateParagraphXML creates page break', () => {
  const paragraph = { breakType: 'page' };
  const xml = generateParagraphXML(paragraph);

  assertContains(xml, 'w:br w:type="page"', 'page break');
});

// Test generateParagraphXML - table
test('generateParagraphXML creates table', () => {
  const paragraph = {
    isTable: true,
    rows: [
      ['Header 1', 'Header 2'],
      ['Data 1', 'Data 2']
    ]
  };
  const xml = generateParagraphXML(paragraph);

  assertContains(xml, 'w:tbl', 'table element');
  assertContains(xml, 'w:tr', 'row element');
  assertContains(xml, 'w:tc', 'cell element');
  assertContains(xml, 'Header 1', 'header content');
});

// Test createDOCXStructure
test('createDOCXStructure creates all required files', () => {
  const outputDir = path.join(__dirname, '..', 'test-output-docx');
  const config = {
    bookTitle: 'Test Book',
    author: 'Test Author',
    volume: 'Volume 1',
    publisher: 'Test Publisher',
    year: '2026',
  };
  const chapters = [
    { num: '1', title: 'Chapter One', titleEn: 'Chapter One', content: 'Test content.', words: 100 },
  ];

  const result = createDOCXStructure(outputDir, config, chapters);

  // Check files exist
  assertTrue(fs.existsSync(path.join(result, '[Content_Types].xml')), 'Content_Types.xml exists');
  assertTrue(fs.existsSync(path.join(result, '_rels', '.rels')), '.rels exists');
  assertTrue(fs.existsSync(path.join(result, 'word', 'document.xml')), 'document.xml exists');
  assertTrue(fs.existsSync(path.join(result, 'word', 'styles.xml')), 'styles.xml exists');
  assertTrue(fs.existsSync(path.join(result, 'word', 'fontTable.xml')), 'fontTable.xml exists');
  assertTrue(fs.existsSync(path.join(result, 'word', 'settings.xml')), 'settings.xml exists');
  assertTrue(fs.existsSync(path.join(result, 'word', 'webSettings.xml')), 'webSettings.xml exists');
  assertTrue(fs.existsSync(path.join(result, 'word', '_rels', 'document.xml.rels')), 'document.xml.rels exists');

  // Clean up
  fs.rmSync(outputDir, { recursive: true, force: true });
});

// Test exportToDOCX
test('exportToDOCX creates valid DOCX file', async () => {
  const outputDir = path.join(__dirname, '..', 'test-output-docx1');
  const config = {
    bookTitle: 'Test Book',
    author: 'Test Author',
    volume: 'Volume 1',
    publisher: 'Test Publisher',
    year: '2026',
    outputDir: outputDir,
  };
  const chapters = [
    { num: '1', title: 'Chapter One', titleEn: 'Chapter One', content: '# Test\n\nTest content.', words: 5 },
  ];

  const docxPath = await exportToDOCX(config, chapters, {
    outputPath: path.join(outputDir, 'test.docx'),
  });

  assertTrue(fs.existsSync(docxPath), 'DOCX file created');

  // Check file has content
  const stats = fs.statSync(docxPath);
  assertTrue(stats.size > 0, 'DOCX has content');

  // Clean up
  fs.rmSync(outputDir, { recursive: true, force: true });
});

// Test exportChapterToDOCX
test('exportChapterToDOCX exports single chapter', async () => {
  const outputDir = path.join(__dirname, '..', 'test-output-docx2');
  const config = {
    bookTitle: 'Test Book',
    author: 'Test Author',
    volume: 'Volume 1',
    publisher: 'Test Publisher',
    year: '2026',
    outputDir: outputDir,
  };
  const chapter = {
    num: '1',
    title: 'Chapter One',
    titleEn: 'Chapter One',
    type: 'core',
    content: '# Test\n\nTest content.',
    words: 5,
  };

  const docxPath = await exportChapterToDOCX(config, chapter, {
    outputPath: path.join(outputDir, 'single_chapter.docx'),
  });

  assertTrue(fs.existsSync(docxPath), 'Single chapter DOCX created');

  // Clean up
  fs.rmSync(outputDir, { recursive: true, force: true });
});

// Test bilingual content support
test('DOCX exporter supports bilingual content', async () => {
  const outputDir = path.join(__dirname, '..', 'test-output-docx3');
  const config = {
    bookTitle: 'Test Book',
    author: 'Test Author',
    volume: 'Volume 1',
    outputDir: outputDir,
  };
  const chapters = [
    { 
      num: '1', 
      title: 'अध्याय एक', 
      titleEn: 'Chapter One', 
      content: '# परीक्षण\n\nयह हिंदी में **डेवनागरी** पाठ है।\n\nThis is English text.', 
      words: 10 
    },
  ];

  const docxPath = await exportToDOCX(config, chapters, {
    outputPath: path.join(outputDir, 'bilingual.docx'),
  });

  assertTrue(fs.existsSync(docxPath), 'Bilingual DOCX created');

  // Clean up
  fs.rmSync(outputDir, { recursive: true, force: true });
});

// Test multiple chapters
test('DOCX exporter handles multiple chapters', async () => {
  const outputDir = path.join(__dirname, '..', 'test-output-docx4');
  const config = {
    bookTitle: 'Test Book',
    author: 'Test Author',
    volume: 'Volume 1',
    outputDir: outputDir,
  };
  const chapters = [
    { num: '1', title: 'Chapter One', titleEn: 'Chapter One', content: 'Content of chapter 1.', words: 5 },
    { num: '2', title: 'Chapter Two', titleEn: 'Chapter Two', content: 'Content of chapter 2.', words: 5 },
    { num: '3', title: 'Chapter Three', titleEn: 'Chapter Three', content: 'Content of chapter 3.', words: 5 },
  ];

  const docxPath = await exportToDOCX(config, chapters, {
    outputPath: path.join(outputDir, 'multi_chapter.docx'),
  });

  assertTrue(fs.existsSync(docxPath), 'Multi-chapter DOCX created');

  // Clean up
  fs.rmSync(outputDir, { recursive: true, force: true });
});

// Summary
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}