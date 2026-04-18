/**
 * DOCX Exporter
 * Generates valid DOCX files (Microsoft Word) from compiled book content.
 * Supports bilingual content (Devanagari + Latin scripts), tables, and formatting.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/**
 * Escapes special characters for XML.
 * @param {string} text
 * @returns {string}
 */
function escapeXML(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates the [Content_Types].xml file.
 * @returns {string}
 */
function generateContentTypes() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/word/webSettings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.webSettings+xml"/>
</Types>`;
}

/**
 * Generates the _rels/.rels file.
 * @returns {string}
 */
function generateRootRels() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
}

/**
 * Generates the word/_rels/document.xml.rels file.
 * @returns {string}
 */
function generateDocumentRels() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/webSettings" Target="webSettings.xml"/>
</Relationships>`;
}

/**
 * Parses markdown-like content into DOCX paragraphs.
 * Supports:
 * - Headings (# ## ###)
 * - Bold (**text**)
 * - Italic (*text*)
 * - Tables (| col1 | col2 |)
 * - Page breaks (--- as paragraph break)
 * - Bilingual content (Devanagari + Latin)
 * @param {string} content - Raw content
 * @returns {Array} Array of paragraph objects
 */
function parseContentToParagraphs(content) {
  if (!content) return [];

  const paragraphs = [];
  const lines = content.split('\n');
  let currentParagraph = { runs: [] };
  let inTable = false;
  let tableRows = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Handle page break marker
    if (line === '---' || line === '***' || line === '___') {
      if (currentParagraph.runs.length > 0) {
        paragraphs.push(currentParagraph);
        currentParagraph = { runs: [], breakType: 'page' };
      } else {
        currentParagraph.breakType = 'page';
      }
      paragraphs.push(currentParagraph);
      currentParagraph = { runs: [] };
      continue;
    }

    // Handle horizontal rule
    if (line.match(/^[-*_]{3,}$/)) {
      paragraphs.push({ isHorizontalRule: true });
      continue;
    }

    // Handle headings
    if (line.match(/^#{1,6}\s+/)) {
      if (currentParagraph.runs.length > 0) {
        paragraphs.push(currentParagraph);
      }
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      const level = match[1].length;
      const text = match[2];
      paragraphs.push({
        isHeading: true,
        headingLevel: level,
        runs: [{ text, bold: true }]
      });
      currentParagraph = { runs: [] };
      continue;
    }

    // Handle table start
    if (line.startsWith('|') && line.endsWith('|')) {
      // Check if it's a separator row (contains only dashes and spaces)
      if (line.match(/^\|[\s\-:|]+\|$/)) {
        continue; // Skip separator rows
      }
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      // Parse table row
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      tableRows.push(cells);
      continue;
    } else if (inTable && line === '') {
      // End of table
      if (tableRows.length > 0) {
        paragraphs.push({ isTable: true, rows: tableRows });
      }
      inTable = false;
      tableRows = [];
      continue;
    } else if (inTable) {
      // Still in table, skip non-table line
      continue;
    }

    // Handle empty line (paragraph break)
    if (line === '') {
      if (currentParagraph.runs.length > 0) {
        paragraphs.push(currentParagraph);
        currentParagraph = { runs: [] };
      }
      continue;
    }

    // Parse inline formatting and build runs
    const runs = parseInlineFormatting(line);
    if (runs.length > 0) {
      currentParagraph.runs.push(...runs);
    }
  }

  // Add remaining paragraph
  if (currentParagraph.runs.length > 0) {
    paragraphs.push(currentParagraph);
  }

  // Handle table at end of content
  if (inTable && tableRows.length > 0) {
    paragraphs.push({ isTable: true, rows: tableRows });
  }

  return paragraphs;
}

/**
 * Parses inline formatting (bold, italic) from text.
 * @param {string} text
 * @returns {Array} Array of run objects
 */
function parseInlineFormatting(text) {
  const runs = [];
  let remaining = text;
  let currentRun = { text: '' };

  while (remaining.length > 0) {
    // Check for bold (**text**)
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
    // Check for italic (*text*)
    const italicMatch = remaining.match(/^\*(.+?)\*/);

    if (boldMatch) {
      if (currentRun.text) {
        runs.push(currentRun);
      }
      runs.push({ text: boldMatch[1], bold: true });
      remaining = remaining.slice(boldMatch[0].length);
      currentRun = { text: '' };
    } else if (italicMatch) {
      if (currentRun.text) {
        runs.push(currentRun);
      }
      runs.push({ text: italicMatch[1], italic: true });
      remaining = remaining.slice(italicMatch[0].length);
      currentRun = { text: '' };
    } else {
      currentRun.text += remaining[0];
      remaining = remaining.slice(1);
    }
  }

  if (currentRun.text) {
    runs.push(currentRun);
  }

  // If no runs created, return the whole text as a run
  if (runs.length === 0 && text) {
    return [{ text }];
  }

  return runs;
}

/**
 * Generates a single paragraph's XML.
 * @param {object} paragraph - Paragraph object
 * @returns {string}
 */
function generateParagraphXML(paragraph) {
  // Handle page break
  if (paragraph.breakType === 'page') {
    return `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
  }

  // Handle horizontal rule
  if (paragraph.isHorizontalRule) {
    return `<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="0" w:color="CCCCCC"/></w:pBdr></w:pPr></w:p>`;
  }

  // Handle heading
  if (paragraph.isHeading) {
    const headingStyle = `Heading${paragraph.headingLevel}`;
    let runsXML = '';
    for (const run of paragraph.runs) {
      runsXML += generateRunXML(run);
    }
    return `<w:p><w:pPr><w:pStyle w:val="${headingStyle}"/></w:pPr>${runsXML}</w:p>`;
  }

  // Handle table
  if (paragraph.isTable) {
    return generateTableXML(paragraph.rows);
  }

  // Regular paragraph
  let runsXML = '';
  for (const run of paragraph.runs) {
    runsXML += generateRunXML(run);
  }

  return `<w:p>${runsXML}</w:p>`;
}

/**
 * Generates a run element with optional formatting.
 * @param {object} run - Run object with text, bold, italic
 * @returns {string}
 */
function generateRunXML(run) {
  const text = escapeXML(run.text || '');
  let props = '';

  if (run.bold) {
    props += '<w:b/>';
  }
  if (run.italic) {
    props += '<w:i/>';
  }

  if (props) {
    return `<w:r><w:rPr>${props}</w:rPr><w:t>${text}</w:t></w:r>`;
  }
  return `<w:r><w:t>${text}</w:t></w:r>`;
}

/**
 * Generates table XML.
 * @param {Array} rows - Array of row arrays (cells)
 * @returns {string}
 */
function generateTableXML(rows) {
  if (!rows || rows.length === 0) return '';

  let tableRowsXML = '';
  const numCols = rows[0] ? rows[0].length : 0;

  for (const row of rows) {
    let cellsXML = '';
    for (let i = 0; i < Math.max(row.length, numCols); i++) {
      const cellText = row[i] || '';
      cellsXML += `<w:tc><w:p><w:r><w:t>${escapeXML(cellText)}</w:t></w:r></w:p></w:tc>`;
    }
    tableRowsXML += `<w:tr>${cellsXML}</w:tr>`;
  }

  return `<w:tbl>${tableRowsXML}</w:tbl>`;
}

/**
 * Generates the main document.xml file.
 * @param {object} config - VolumeConfig
 * @param {Array} chapters - Chapter objects
 * @returns {string}
 */
function generateDocumentXML(config, chapters) {
  const { bookTitle, author } = config;

  let bodyContent = '';

  // Add title
  bodyContent += `<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t>${escapeXML(bookTitle)}</w:t></w:r></w:p>`;

  // Add author
  bodyContent += `<w:p><w:r><w:t>By ${escapeXML(author)}</w:t></w:r></w:p>`;

  // Add chapters
  for (const chapter of chapters) {
    // Chapter heading
    bodyContent += `<w:p><w:pPr><w:br w:type="page"/><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>Chapter ${escapeXML(chapter.num)}: ${escapeXML(chapter.title || chapter.titleEn)}</w:t></w:r></w:p>`;

    // Chapter content
    const paragraphs = parseContentToParagraphs(chapter.content || '');
    for (const paragraph of paragraphs) {
      bodyContent += generateParagraphXML(paragraph);
    }
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyContent}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

/**
 * Generates the styles.xml file.
 * @returns {string}
 */
function generateStylesXML() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
        <w:sz w:val="24"/>
        <w:lang w:val="en-US"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:basedOn w:val="Normal"/>
    <w:uiPriority w:val="1"/>
    <w:qFormat/>
    <w:rPr>
      <w:b/>
      <w:sz w:val="44"/>
      <w:spacing w:val="200"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="Heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:uiPriority w:val="9"/>
    <w:qFormat/>
    <w:rPr>
      <w:b/>
      <w:sz w:val="32"/>
      <w:spacing w:val="100"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="Heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:uiPriority w:val="9"/>
    <w:qFormat/>
    <w:rPr>
      <w:b/>
      <w:sz w:val="28"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="Heading 3"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:uiPriority w:val="9"/>
    <w:qFormat/>
    <w:rPr>
      <w:b/>
      <w:sz w:val="26"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
    <w:rPr>
      <w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
      <w:sz w:val="24"/>
    </w:rPr>
  </w:style>
</w:styles>`;
}

/**
 * Generates the fontTable.xml file.
 * @returns {string}
 */
function generateFontTableXML() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:fonts xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:font w:name="Times New Roman">
    <w:panose1 w:val="02020603050405020304"/>
    <w:charset w:val="00"/>
    <w:family w:val="roman"/>
    <w:pitch w:val="variable"/>
  </w:font>
  <w:font w:name="Arial">
    <w:panose1 w:val="020B06040202020202"/>
    <w:charset w:val="00"/>
    <w:family w:val="swiss"/>
    <w:pitch w:val="variable"/>
  </w:font>
</w:fonts>`;
}

/**
 * Generates the settings.xml file.
 * @returns {string}
 */
function generateSettingsXML() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:zoom w:percent="100"/>
  <w:defaultTabStop w:val="720"/>
  <w:characterSpacingControl w:val="doNotCompress"/>
</w:settings>`;
}

/**
 * Generates the webSettings.xml file.
 * @returns {string}
 */
function generateWebSettingsXML() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:webSettings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:optimizeForBrowser/>
</w:webSettings>`;
}

/**
 * Creates the DOCX directory structure and files.
 * @param {string} outputDir - Directory to create DOCX structure in
 * @param {object} config - VolumeConfig
 * @param {Array} chapters - Chapter objects
 * @returns {string} Path to the DOCX directory
 */
function createDOCXStructure(outputDir, config, chapters) {
  const docxDir = path.join(outputDir, 'docx-temp');
  const wordDir = path.join(docxDir, 'word');
  const relsDir = path.join(docxDir, '_rels');
  const wordRelsDir = path.join(wordDir, '_rels');

  // Create directories
  fs.mkdirSync(docxDir, { recursive: true });
  fs.mkdirSync(wordDir, { recursive: true });
  fs.mkdirSync(relsDir, { recursive: true });
  fs.mkdirSync(wordRelsDir, { recursive: true });

  // Write [Content_Types].xml
  fs.writeFileSync(
    path.join(docxDir, '[Content_Types].xml'),
    generateContentTypes()
  );

  // Write _rels/.rels
  fs.writeFileSync(
    path.join(relsDir, '.rels'),
    generateRootRels()
  );

  // Write word/document.xml
  fs.writeFileSync(
    path.join(wordDir, 'document.xml'),
    generateDocumentXML(config, chapters)
  );

  // Write word/styles.xml
  fs.writeFileSync(
    path.join(wordDir, 'styles.xml'),
    generateStylesXML()
  );

  // Write word/fontTable.xml
  fs.writeFileSync(
    path.join(wordDir, 'fontTable.xml'),
    generateFontTableXML()
  );

  // Write word/settings.xml
  fs.writeFileSync(
    path.join(wordDir, 'settings.xml'),
    generateSettingsXML()
  );

  // Write word/webSettings.xml
  fs.writeFileSync(
    path.join(wordDir, 'webSettings.xml'),
    generateWebSettingsXML()
  );

  // Write word/_rels/document.xml.rels
  fs.writeFileSync(
    path.join(wordRelsDir, 'document.xml.rels'),
    generateDocumentRels()
  );

  return docxDir;
}

/**
 * Creates a ZIP file from the DOCX structure.
 * @param {string} docxDir - Path to DOCX directory
 * @param {string} outputPath - Path for the output DOCX file
 * @returns {Promise<void>}
 */
async function createDOCXZip(docxDir, outputPath) {
  const { createReadStream, createWriteStream, readdirSync, statSync } = require('fs');
  const { pipeline } = require('stream');
  const { promisify } = require('util');
  const pipelineAsync = promisify(pipeline);

  // Collect all files to add to ZIP
  const files = [];

  function addDirectory(dir, basePath = '') {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const relativePath = basePath ? path.join(basePath, entry) : entry;
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        addDirectory(fullPath, relativePath);
      } else {
        files.push({ fullPath, relativePath, isDirectory: false });
      }
    }
  }

  addDirectory(docxDir);

  const chunks = [];

  // Process each file
  for (const file of files) {
    const fileData = fs.readFileSync(file.fullPath);
    const fileName = file.relativePath.replace(/\\/g, '/');

    // Compress file data
    const compressedData = zlib.deflateSync(fileData, { level: 9 });

    // Local file header
    const localHeader = Buffer.alloc(30 + fileName.length);
    let offset = 0;

    // Local file header signature
    localHeader.writeUInt32LE(0x04034b50, offset); offset += 4;
    // Version needed to extract
    localHeader.writeUInt16LE(20, offset); offset += 2;
    // General purpose bit flag
    localHeader.writeUInt16LE(0, offset); offset += 2;
    // Compression method (Deflate)
    localHeader.writeUInt16LE(8, offset); offset += 2;
    // Last mod file time
    localHeader.writeUInt16LE(0, offset); offset += 2;
    // Last mod file date
    localHeader.writeUInt16LE(0, offset); offset += 2;
    // CRC-32 (unsigned value)
    const crc32 = zlib.crc32(fileData);
    localHeader.writeUInt32LE(crc32 >>> 0, offset); offset += 4;
    // Compressed size
    localHeader.writeUInt32LE(compressedData.length, offset); offset += 4;
    // Uncompressed size
    localHeader.writeUInt32LE(fileData.length, offset); offset += 4;
    // File name length
    localHeader.writeUInt16LE(fileName.length, offset); offset += 2;
    // Extra field length
    localHeader.writeUInt16LE(0, offset); offset += 2;
    // File name
    localHeader.write(fileName, offset, 'utf8');

    chunks.push(Buffer.concat([localHeader, compressedData]));
  }

  // Build central directory
  const centralDirChunks = [];
  let dataOffset = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileName = file.relativePath.replace(/\\/g, '/');
    const fileData = fs.readFileSync(file.fullPath);
    const compressedData = zlib.deflateSync(fileData, { level: 9 });

    const centralHeader = Buffer.alloc(46 + fileName.length);
    let offset = 0;

    // Central file header signature
    centralHeader.writeUInt32LE(0x02014b50, offset); offset += 4;
    // Version made by
    centralHeader.writeUInt16LE(20, offset); offset += 2;
    // Version needed to extract
    centralHeader.writeUInt16LE(20, offset); offset += 2;
    // General purpose bit flag
    centralHeader.writeUInt16LE(0, offset); offset += 2;
    // Compression method
    centralHeader.writeUInt16LE(8, offset); offset += 2;
    // Last mod file time
    centralHeader.writeUInt16LE(0, offset); offset += 2;
    // Last mod file date
    centralHeader.writeUInt16LE(0, offset); offset += 2;
    // CRC-32 (unsigned value)
    const crc32Val = zlib.crc32(fileData);
    centralHeader.writeUInt32LE(crc32Val >>> 0, offset); offset += 4;
    // Compressed size
    centralHeader.writeUInt32LE(compressedData.length, offset); offset += 4;
    // Uncompressed size
    centralHeader.writeUInt32LE(fileData.length, offset); offset += 4;
    // File name length
    centralHeader.writeUInt16LE(fileName.length, offset); offset += 2;
    // Extra field length
    centralHeader.writeUInt16LE(0, offset); offset += 2;
    // File comment length
    centralHeader.writeUInt16LE(0, offset); offset += 2;
    // Disk number start
    centralHeader.writeUInt16LE(0, offset); offset += 2;
    // Internal file attributes
    centralHeader.writeUInt16LE(0, offset); offset += 2;
    // External file attributes
    centralHeader.writeUInt32LE(0, offset); offset += 4;
    // Relative offset of local header
    centralHeader.writeUInt32LE(dataOffset, offset); offset += 4;
    // File name
    centralHeader.write(fileName, offset, 'utf8');

    centralDirChunks.push(centralHeader);
    dataOffset += 30 + fileName.length + compressedData.length;
  }

  const centralDir = Buffer.concat(centralDirChunks);
  const centralDirOffset = chunks.reduce((sum, c) => sum + c.length, 0);

  // End of central directory record
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // End of central dir signature
  eocd.writeUInt16LE(0, 4); // Number of this disk
  eocd.writeUInt16LE(0, 6); // Disk where central directory starts
  eocd.writeUInt16LE(files.length, 8); // Number of central directory records on this disk
  eocd.writeUInt16LE(files.length, 10); // Total number of central directory records
  eocd.writeUInt32LE(centralDir.length, 12); // Size of central directory
  eocd.writeUInt32LE(centralDirOffset, 16); // Offset of start of central directory
  eocd.writeUInt16LE(0, 20); // Comment length

  // Write the ZIP file
  const zipData = Buffer.concat([...chunks, centralDir, eocd]);
  fs.writeFileSync(outputPath, zipData);
}

/**
 * Exports a volume to DOCX format.
 * @param {object} config - VolumeConfig
 * @param {Array} chapters - Array of chapter objects
 * @param {object} options - Export options
 * @param {string} [options.outputPath] - Output file path (optional)
 * @param {boolean} [options.includeFrontMatter=true] - Include front matter (title page)
 * @returns {Promise<string>} Path to the generated DOCX file
 */
async function exportToDOCX(config, chapters, options = {}) {
  const {
    outputPath,
    includeFrontMatter = true,
  } = options;

  const outputDir = config.outputDir || 'output';
  const docxFileName = `${config.bookTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${config.volume || 'vol1'}.docx`;
  const docxPath = outputPath || path.join(outputDir, docxFileName);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Create DOCX structure
  const docxDir = createDOCXStructure(outputDir, config, chapters);

  // Create the DOCX ZIP file
  await createDOCXZip(docxDir, docxPath);

  // Clean up temporary directory
  fs.rmSync(docxDir, { recursive: true, force: true });

  return docxPath;
}

/**
 * Exports a single chapter to DOCX format.
 * @param {object} config - VolumeConfig
 * @param {object} chapter - Chapter object
 * @param {object} options - Export options
 * @returns {Promise<string>} Path to the generated DOCX file
 */
async function exportChapterToDOCX(config, chapter, options = {}) {
  return exportToDOCX(config, [chapter], options);
}

module.exports = {
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
};