/**
 * EPUB Exporter
 * Generates valid EPUB 3.0 files from compiled book content.
 */

const fs = require('fs');
const path = require('path');
const { markdownToHTML } = require('./markdown-to-html');

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
 * Generates the mimetype file content (must be first in EPUB ZIP, uncompressed).
 * @returns {string}
 */
function generateMimetype() {
  return 'application/epub+zip';
}

/**
 * Generates the META-INF/container.xml file.
 * @param {string} opfPath - Path to the OPF file relative to container.xml
 * @returns {string}
 */
function generateContainerXML(opfPath) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="${opfPath}" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
}

/**
 * Generates the OEBPS/content.opf (package document).
 * @param {object} config - VolumeConfig
 * @param {Array} chapters - Chapter objects
 * @param {object} manifest - Manifest items with id and href
 * @returns {string}
 */
function generateOPF(config, chapters, manifest) {
  const { bookTitle, author, language = 'en', identifier, year } = config;
  const uuid = identifier || `urn:uuid:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const pubYear = year || new Date().getFullYear().toString();

  let manifestItems = '';
  let spineItems = '';

  // Add navigation document first
  manifestItems += `    <item id="nav" href="toc.xhtml" media-type="application/xhtml+xml" properties="nav"/>\n`;
  spineItems += `    <itemref idref="nav"/>\n`;

  // Add styles
  manifestItems += `    <item id="css" href="styles/style.css" media-type="text/css"/>\n`;

  // Add chapters
  for (const item of manifest) {
    manifestItems += `    <item id="${item.id}" href="${item.href}" media-type="application/xhtml+xml"/>\n`;
    spineItems += `    <itemref idref="${item.id}"/>\n`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${escapeXML(uuid)}</dc:identifier>
    <dc:title>${escapeXML(bookTitle)}</dc:title>
    <dc:creator>${escapeXML(author)}</dc:creator>
    <dc:language>${escapeXML(language)}</dc:language>
    <dc:publisher>${escapeXML(config.publisher || 'Self-published')}</dc:publisher>
    <dc:date>${pubYear}-01-01</dc:date>
    <meta property="dcterms:modified">${pubYear}-01-01T00:00:00Z</meta>
  </metadata>
  <manifest>
${manifestItems}  </manifest>
  <spine>
${spineItems}  </spine>
</package>`;
}

/**
 * Generates the OEBPS/toc.ncx (table of contents for backward compatibility).
 * @param {object} config - VolumeConfig
 * @param {Array} chapters - Chapter objects
 * @returns {string}
 */
function generateNCX(config, chapters) {
  const { bookTitle } = config;
  let navPoints = '';

  chapters.forEach((ch, index) => {
    const playOrder = index + 1;
    navPoints += `    <navPoint id="navPoint-${playOrder}" playOrder="${playOrder}">
      <navLabel>
        <text>Chapter ${ch.num}: ${escapeXML(ch.title)}</text>
      </navLabel>
      <content src="chapter${index + 1}.xhtml"/>
    </navPoint>\n`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:${Date.now()}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${escapeXML(bookTitle)}</text>
  </docTitle>
  <navMap>
${navPoints}  </navMap>
</ncx>`;
}

/**
 * Generates the OEBPS/toc.xhtml (EPUB 3.0 navigation document).
 * @param {object} config - VolumeConfig
 * @param {Array} chapters - Chapter objects
 * @returns {string}
 */
function generateNavDocument(config, chapters) {
  const { bookTitle } = config;
  let navList = '';

  chapters.forEach((ch, index) => {
    navList += `      <li>
        <a href="chapter${index + 1}.xhtml">Chapter ${escapeXML(ch.num)}: ${escapeXML(ch.title)}</a>
      </li>\n`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en">
<head>
  <title>Table of Contents</title>
  <link rel="stylesheet" type="text/css" href="styles/style.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
${navList}    </ol>
  </nav>
</body>
</html>`;
}

/**
 * Generates a chapter XHTML file.
 * @param {object} chapter - Chapter object with num, title, content
 * @param {number} index - Chapter index (1-based)
 * @returns {string}
 */
function generateChapterXHTML(chapter, index) {
  const htmlContent = markdownToHTML(chapter.content || '');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <title>Chapter ${escapeXML(chapter.num)}: ${escapeXML(chapter.title)}</title>
  <link rel="stylesheet" type="text/css" href="styles/style.css"/>
</head>
<body>
  <section epub:type="chapter" xmlns:epub="http://www.idpf.org/2007/ops">
    <h2>Chapter ${escapeXML(chapter.num)}: ${escapeXML(chapter.title)}</h2>
    ${htmlContent}
  </section>
</body>
</html>`;
}

/**
 * Generates the EPUB stylesheet.
 * @returns {string}
 */
function generateStyles() {
  return `/* EPUB Stylesheet */
@charset "UTF-8";

body {
  font-family: "Noto Serif", "Source Serif Pro", Georgia, serif;
  font-size: 1em;
  line-height: 1.6;
  margin: 1em;
  padding: 0;
  color: #333;
}

h1 {
  font-size: 1.8em;
  text-align: center;
  margin: 1em 0;
  page-break-after: always;
}

h2 {
  font-size: 1.4em;
  margin: 1em 0 0.5em;
  page-break-after: avoid;
}

h3 {
  font-size: 1.2em;
  margin: 0.8em 0 0.4em;
  page-break-after: avoid;
}

h4 {
  font-size: 1.1em;
  margin: 0.6em 0 0.3em;
}

p {
  text-indent: 1.5em;
  margin: 0;
  text-align: justify;
}

p:first-of-type {
  text-indent: 0;
}

strong {
  font-weight: bold;
}

em {
  font-style: italic;
}

code {
  font-family: "Courier New", monospace;
  background-color: #f5f5f5;
  padding: 0.1em 0.3em;
  font-size: 0.9em;
}

blockquote {
  margin: 1em 2em;
  padding: 0.5em 1em;
  border-left: 3px solid #ccc;
  background-color: #f9f9f9;
  font-style: italic;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
  page-break-inside: avoid;
}

th, td {
  border: 1px solid #ccc;
  padding: 0.5em;
  text-align: left;
}

th {
  background-color: #f0f0f0;
  font-weight: bold;
}

tr:nth-child(even) {
  background-color: #fafafa;
}

ul, ol {
  margin: 0.5em 0;
  padding-left: 2em;
}

li {
  margin: 0.3em 0;
}

hr {
  border: none;
  border-top: 1px solid #ccc;
  margin: 1em 0;
}

/* Navigation */
nav#toc {
  padding: 1em;
}

nav#toc h1 {
  font-size: 1.4em;
  text-align: left;
  page-break-after: avoid;
}

nav#toc ol {
  list-style-type: decimal;
}

nav#toc li {
  margin: 0.5em 0;
}

nav#toc a {
  text-decoration: none;
  color: #333;
}
`;
}

/**
 * Creates the EPUB directory structure and files.
 * @param {string} outputDir - Directory to create EPUB structure in
 * @param {object} config - VolumeConfig
 * @param {Array} chapters - Chapter objects
 * @returns {object} Manifest of created files
 */
function createEPUBStructure(outputDir, config, chapters) {
  const epubDir = path.join(outputDir, 'epub-temp');
  const oebpsDir = path.join(epubDir, 'OEBPS');
  const stylesDir = path.join(oebpsDir, 'styles');

  // Create directories
  fs.mkdirSync(epubDir, { recursive: true });
  fs.mkdirSync(path.join(epubDir, 'META-INF'), { recursive: true });
  fs.mkdirSync(oebpsDir, { recursive: true });
  fs.mkdirSync(stylesDir, { recursive: true });

  // Write mimetype (must be first, uncompressed)
  fs.writeFileSync(path.join(epubDir, 'mimetype'), generateMimetype());

  // Write container.xml
  fs.writeFileSync(
    path.join(epubDir, 'META-INF', 'container.xml'),
    generateContainerXML('OEBPS/content.opf')
  );

  // Create manifest for chapters
  const manifest = chapters.map((ch, index) => ({
    id: `chapter${index + 1}`,
    href: `chapter${index + 1}.xhtml`
  }));

  // Write content.opf
  fs.writeFileSync(
    path.join(oebpsDir, 'content.opf'),
    generateOPF(config, chapters, manifest)
  );

  // Write toc.ncx (backward compatibility)
  fs.writeFileSync(
    path.join(oebpsDir, 'toc.ncx'),
    generateNCX(config, chapters)
  );

  // Write toc.xhtml (EPUB 3.0 navigation)
  fs.writeFileSync(
    path.join(oebpsDir, 'toc.xhtml'),
    generateNavDocument(config, chapters)
  );

  // Write styles
  fs.writeFileSync(
    path.join(stylesDir, 'style.css'),
    generateStyles()
  );

  // Write chapter files
  chapters.forEach((chapter, index) => {
    fs.writeFileSync(
      path.join(oebpsDir, `chapter${index + 1}.xhtml`),
      generateChapterXHTML(chapter, index + 1)
    );
  });

  return { epubDir, manifest };
}

/**
 * Creates a ZIP file from the EPUB structure using pure Node.js (no external dependencies).
 * @param {string} epubDir - Path to EPUB directory
 * @param {string} outputPath - Path for the output EPUB file
 * @returns {Promise<void>}
 */
async function createEPUBZip(epubDir, outputPath) {
  const zlib = require('zlib');
  const { createReadStream, createWriteStream, readdirSync, statSync } = fs;

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
  
  addDirectory(epubDir);

  // Create ZIP using Node.js built-in zlib
  // This creates a simple ZIP with deflate compression
  const { pipeline } = require('stream');
  const { promisify } = require('util');
  const pipelineAsync = promisify(pipeline);

  // ZIP file format: 
  // - Local file header for each file
  // - File data (compressed or stored)
  // - Central directory
  // - End of central directory record

  const chunks = [];
  
  // Process each file
  for (const file of files) {
    const fileData = fs.readFileSync(file.fullPath);
    const fileName = file.relativePath.replace(/\\/g, '/');
    const isMimetype = fileName === 'mimetype';
    
    // Compress file data (store for mimetype, deflate for others)
    let compressedData;
    let compressionMethod;
    
    if (isMimetype) {
      // mimetype must be stored (no compression)
      compressedData = fileData;
      compressionMethod = 0; // Stored
    } else {
      compressedData = zlib.deflateSync(fileData, { level: 9 });
      compressionMethod = 8; // Deflate
    }

    // Local file header
    const localHeader = Buffer.alloc(30 + fileName.length);
    let offset = 0;
    
    // Local file header signature
    localHeader.writeUInt32LE(0x04034b50, offset); offset += 4;
    // Version needed to extract
    localHeader.writeUInt16LE(20, offset); offset += 2;
    // General purpose bit flag
    localHeader.writeUInt16LE(0, offset); offset += 2;
    // Compression method
    localHeader.writeUInt16LE(compressionMethod, offset); offset += 2;
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
    const isMimetype = fileName === 'mimetype';
    
    let compressedData;
    if (isMimetype) {
      compressedData = fileData;
    } else {
      compressedData = zlib.deflateSync(fileData, { level: 9 });
    }

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
    centralHeader.writeUInt16LE(isMimetype ? 0 : 8, offset); offset += 2;
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
 * Exports a volume to EPUB format.
 * @param {object} config - VolumeConfig
 * @param {Array} chapters - Array of chapter objects
 * @param {object} options - Export options
 * @param {string} options.outputPath - Output file path (optional)
 * @param {boolean} options.includeFrontMatter - Include front matter (default: true)
 * @param {boolean} options.includeBackMatter - Include back matter (default: true)
 * @returns {Promise<string>} Path to the generated EPUB file
 */
async function exportToEPUB(config, chapters, options = {}) {
  const {
    outputPath,
    includeFrontMatter = true,
    includeBackMatter = true
  } = options;

  const outputDir = config.outputDir || 'output';
  const epubFileName = `${config.bookTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${config.volume || 'vol1'}.epub`;
  const epubPath = outputPath || path.join(outputDir, epubFileName);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Create EPUB structure
  const { epubDir } = createEPUBStructure(outputDir, config, chapters);

  // Create the EPUB ZIP file
  await createEPUBZip(epubDir, epubPath);

  // Clean up temporary directory
  fs.rmSync(epubDir, { recursive: true, force: true });

  return epubPath;
}

/**
 * Exports a single chapter to EPUB format.
 * @param {object} config - VolumeConfig
 * @param {object} chapter - Chapter object
 * @param {object} options - Export options
 * @returns {Promise<string>} Path to the generated EPUB file
 */
async function exportChapterToEPUB(config, chapter, options = {}) {
  return exportToEPUB(config, [chapter], options);
}

module.exports = {
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
};