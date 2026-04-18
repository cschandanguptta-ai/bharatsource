/**
 * EPUB Exporter Tests
 * Tests for EPUB 3.0 export functionality.
 */

const fs = require('fs');
const path = require('path');
const {
  exportToEPUB,
  exportChapterToEPUB,
  generateMimetype,
  generateContainerXML,
  generateOPF,
  generateNCX,
  generateNavDocument,
  generateChapterXHTML,
  generateStyles,
  createEPUBStructure,
} = require('./epub-exporter');

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
  if (!str.includes(substring)) {
    throw new Error(`${message || 'Assertion failed'}: expected string to contain ${JSON.stringify(substring)}`);
  }
}

// Test generateMimetype
test('generateMimetype returns correct MIME type', () => {
  const mimetype = generateMimetype();
  assertEqual(mimetype, 'application/epub+zip', 'MIME type');
});

// Test generateContainerXML
test('generateContainerXML creates valid container.xml', () => {
  const container = generateContainerXML('OEBPS/content.opf');
  assertContains(container, 'urn:oasis:names:tc:opendocument:xmlns:container', 'namespace');
  assertContains(container, 'OEBPS/content.opf', 'OPF path');
  assertContains(container, 'application/oebps-package+xml', 'media-type');
});

// Test generateOPF
test('generateOPF creates valid package document', () => {
  const config = {
    bookTitle: 'Test Book',
    author: 'Test Author',
    language: 'en',
    year: '2026',
    publisher: 'Test Publisher',
  };
  const chapters = [
    { num: '1', title: 'Chapter One', titleEn: 'Chapter One', type: 'core', content: 'Content 1', words: 1000 },
    { num: '2', title: 'Chapter Two', titleEn: 'Chapter Two', type: 'core', content: 'Content 2', words: 1500 },
  ];
  const manifest = [
    { id: 'chapter1', href: 'chapter1.xhtml' },
    { id: 'chapter2', href: 'chapter2.xhtml' },
  ];
  
  const opf = generateOPF(config, chapters, manifest);
  assertContains(opf, 'Test Book', 'book title');
  assertContains(opf, 'Test Author', 'author');
  assertContains(opf, 'dc:identifier', 'identifier');
  assertContains(opf, 'manifest', 'manifest section');
  assertContains(opf, 'spine', 'spine section');
  assertContains(opf, 'chapter1', 'chapter in manifest');
});

// Test generateNCX
test('generateNCX creates valid NCX for backward compatibility', () => {
  const config = { bookTitle: 'Test Book' };
  const chapters = [
    { num: '1', title: 'Chapter One' },
    { num: '2', title: 'Chapter Two' },
  ];
  
  const ncx = generateNCX(config, chapters);
  assertContains(ncx, 'ncx', 'NCX element');
  assertContains(ncx, 'navMap', 'navMap');
  assertContains(ncx, 'Chapter One', 'chapter title');
  assertContains(ncx, 'navPoint', 'navPoint');
});

// Test generateNavDocument
test('generateNavDocument creates EPUB 3.0 navigation', () => {
  const config = { bookTitle: 'Test Book' };
  const chapters = [
    { num: '1', title: 'Chapter One' },
    { num: '2', title: 'Chapter Two' },
  ];
  
  const nav = generateNavDocument(config, chapters);
  assertContains(nav, 'nav epub:type="toc"', 'navigation element');
  assertContains(nav, 'Table of Contents', 'TOC title');
  assertContains(nav, 'chapter1.xhtml', 'chapter link');
});

// Test generateChapterXHTML
test('generateChapterXHTML creates valid XHTML', () => {
  const chapter = {
    num: '1',
    title: 'Test Chapter',
    content: '# Heading\n\nParagraph text.',
  };
  
  const xhtml = generateChapterXHTML(chapter, 1);
  assertContains(xhtml, '<?xml version="1.0"', 'XML declaration');
  assertContains(xhtml, '<!DOCTYPE html>', 'DOCTYPE');
  assertContains(xhtml, 'Test Chapter', 'chapter title');
  assertContains(xhtml, '<h2>', 'heading');
  assertContains(xhtml, '<p>', 'paragraph');
});

// Test generateStyles
test('generateStyles creates valid CSS', () => {
  const styles = generateStyles();
  assertContains(styles, 'body {', 'body selector');
  assertContains(styles, 'font-family', 'font-family');
  assertContains(styles, 'h1 {', 'h1 styling');
  assertContains(styles, 'page-break-after', 'page breaks');
});

// Test createEPUBStructure
test('createEPUBStructure creates all required files', () => {
  const outputDir = path.join(__dirname, '..', 'test-output-epub');
  const config = {
    bookTitle: 'Test Book',
    author: 'Test Author',
    volume: 'Volume 1',
    publisher: 'Test Publisher',
    year: '2026',
  };
  const chapters = [
    { num: '1', title: 'Chapter One', titleEn: 'Chapter One', type: 'core', content: 'Content', words: 100 },
  ];
  
  const result = createEPUBStructure(outputDir, config, chapters);
  
  // Check files exist
  const epubDir = result.epubDir;
  assertEqual(fs.existsSync(path.join(epubDir, 'mimetype')), true, 'mimetype exists');
  assertEqual(fs.existsSync(path.join(epubDir, 'META-INF', 'container.xml')), true, 'container.xml exists');
  assertEqual(fs.existsSync(path.join(epubDir, 'OEBPS', 'content.opf')), true, 'content.opf exists');
  assertEqual(fs.existsSync(path.join(epubDir, 'OEBPS', 'toc.ncx')), true, 'toc.ncx exists');
  assertEqual(fs.existsSync(path.join(epubDir, 'OEBPS', 'toc.xhtml')), true, 'toc.xhtml exists');
  assertEqual(fs.existsSync(path.join(epubDir, 'OEBPS', 'styles', 'style.css')), true, 'style.css exists');
  assertEqual(fs.existsSync(path.join(epubDir, 'OEBPS', 'chapter1.xhtml')), true, 'chapter file exists');
  
  // Clean up
  fs.rmSync(outputDir, { recursive: true, force: true });
});

// Test exportToEPUB
test('exportToEPUB creates valid EPUB file', async () => {
  const outputDir = path.join(__dirname, '..', 'test-output-epub1');
  const config = {
    bookTitle: 'Test Book',
    author: 'Test Author',
    volume: 'Volume 1',
    publisher: 'Test Publisher',
    year: '2026',
    outputDir: outputDir,
  };
  const chapters = [
    { num: '1', title: 'Chapter One', titleEn: 'Chapter One', type: 'core', content: '# Test\n\nTest content.', words: 5 },
  ];
  
  const epubPath = await exportToEPUB(config, chapters, {
    outputPath: path.join(outputDir, 'test.epub'),
  });
  
  assertEqual(fs.existsSync(epubPath), true, 'EPUB file created');
  
  // Check file has content
  const stats = fs.statSync(epubPath);
  assertEqual(stats.size > 0, true, 'EPUB has content');
  
  // Clean up
  fs.rmSync(outputDir, { recursive: true, force: true });
});

// Test exportChapterToEPUB
test('exportChapterToEPUB exports single chapter', async () => {
  const outputDir = path.join(__dirname, '..', 'test-output-epub2');
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
  
  const epubPath = await exportChapterToEPUB(config, chapter, {
    outputPath: path.join(outputDir, 'single_chapter.epub'),
  });
  
  assertEqual(fs.existsSync(epubPath), true, 'Single chapter EPUB created');
  
  // Clean up
  fs.rmSync(outputDir, { recursive: true, force: true });
});

// Summary
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}