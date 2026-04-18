/**
 * Volume Compiler
 * Orchestrates the compilation of a single book volume from chapter files.
 * Processes chapters in manifest order, generates front/back matter, and writes output.
 */

const fs = require('fs');
const path = require('path');

const { extractMarkdownFromFile } = require('./markdown-extractor');
const { ChapterManifest } = require('./chapter-manifest');

/**
 * Export options for markdown export.
 * @typedef {Object} ExportOptions
 * @property {boolean} [includeFrontMatter=true] - Include front matter in export
 * @property {boolean} [includeBackMatter=true] - Include back matter in export
 * @property {string|null} [chapterNumber=null] - Export specific chapter by number (e.g., "1" or "B1"), null for all chapters
 * @property {string} [format='md'] - Export format: 'md' or 'html'
 */

/** @type {ExportOptions} */
const DEFAULT_EXPORT_OPTIONS = {
  includeFrontMatter: true,
  includeBackMatter: true,
  chapterNumber: null,
  format: 'md',
};

/**
 * Counts words in a markdown string using simple whitespace splitting.
 *
 * @param {string} text - Markdown content
 * @returns {number} Word count
 */
function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  return text.split(/\s+/).filter(token => token.length > 0).length;
}

/**
 * Generates front matter for the volume (placeholder — full implementation in task 2.3).
 *
 * @param {object} config - VolumeConfig
 * @param {Array} chapters - Processed chapter objects with content and word counts
 * @returns {string} Front matter markdown
 */
function generateFrontMatter(config, chapters) {
  // Placeholder: full implementation in task 2.3
  return `# ${config.bookTitle}\n\n## ${config.bookSubtitle}\n\n*${config.volume}*\n\n---\n\n`;
}

/**
 * Generates a table of contents from the processed chapters.
 *
 * @param {Array} chapters - Processed chapter objects
 * @returns {string} Table of contents markdown
 */
function generateTableOfContents(chapters) {
  const coreChapters = chapters.filter(ch => ch.type === 'core');
  const bonusChapters = chapters.filter(ch => ch.type === 'bonus');

  let toc = '## Table of Contents\n\n';

  if (coreChapters.length > 0) {
    toc += '### Core Chapters\n\n';
    for (const ch of coreChapters) {
      toc += `- Chapter ${ch.num}: ${ch.titleEn} (${ch.words} words)\n`;
    }
    toc += '\n';
  }

  if (bonusChapters.length > 0) {
    toc += '### Bonus Chapters\n\n';
    for (const ch of bonusChapters) {
      toc += `- Bonus ${ch.num}: ${ch.titleEn} (${ch.words} words)\n`;
    }
    toc += '\n';
  }

  return toc + '---\n\n';
}

/**
 * Generates back matter for the volume (placeholder — full implementation in task 2.4).
 *
 * @param {object} config - VolumeConfig
 * @returns {string} Back matter markdown
 */
function generateBackMatter(config) {
  // Placeholder: full implementation in task 2.4
  return `\n---\n\n## About the Author\n\n*${config.author}*\n`;
}

/**
 * Exports a single chapter or all chapters to markdown.
 * Supports optional front matter and back matter inclusion.
 *
 * @param {object} config - VolumeConfig
 * @param {ExportOptions} [options] - Export options
 * @returns {object} Export result with file path and content
 */
function exportToMarkdown(config, options = {}) {
  const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  
  // Build manifest and get ordered chapters that exist on disk
  const manifest = new ChapterManifest(config.chapterManifest);
  const orderedChapters = manifest.getOrderedChapters(config.chaptersDir);

  // Process each chapter: extract markdown and count words
  const chapters = [];
  for (const meta of orderedChapters) {
    const filePath = path.join(config.chaptersDir, meta.file);
    try {
      const content = extractMarkdownFromFile(filePath);
      const words = countWords(content);
      chapters.push({
        file: meta.file,
        num: meta.num,
        title: meta.title,
        titleEn: meta.titleEn,
        type: meta.type,
        content,
        words,
      });
    } catch (err) {
      console.warn(`[VolumeCompiler] Failed to process chapter ${meta.file}: ${err.message}`);
    }
  }

  // Filter to specific chapter if requested
  let chaptersToExport = chapters;
  if (opts.chapterNumber !== null) {
    chaptersToExport = chapters.filter(ch => String(ch.num) === String(opts.chapterNumber));
    if (chaptersToExport.length === 0) {
      throw new Error(`Chapter "${opts.chapterNumber}" not found in manifest`);
    }
  }

  // Build the output content
  let output = '';

  // Add front matter if requested
  if (opts.includeFrontMatter) {
    output += generateFrontMatter(config, chaptersToExport);
    output += generateTableOfContents(chaptersToExport);
  }

  // Add chapter content
  const chapterContent = chaptersToExport
    .map(ch => ch.content)
    .join('\n\n---\n\n');
  output += chapterContent;

  // Add back matter if requested
  if (opts.includeBackMatter) {
    output += generateBackMatter(config);
  }

  // Determine output file path
  const volumeSlug = config.volume
    ? config.volume.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    : 'volume';
  
  let fileName;
  if (opts.chapterNumber !== null) {
    // Individual chapter export
    fileName = `chapter_${opts.chapterNumber}_${volumeSlug}.md`;
  } else {
    // Full volume export
    fileName = config.output?.fileNames?.md || `manuscript_${volumeSlug}.md`;
  }

  const outputDir = config.outputDir || './output';
  const outputPath = path.join(outputDir, fileName);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write the file
  fs.writeFileSync(outputPath, output, 'utf8');

  const totalWords = chaptersToExport.reduce((sum, ch) => sum + ch.words, 0);

  return {
    success: true,
    filePath: outputPath,
    totalWords,
    totalChapters: chaptersToExport.length,
    chapterNumber: opts.chapterNumber,
    options: opts,
  };
}

/**
 * Exports a specific chapter by number.
 * Convenience function for individual chapter export.
 *
 * @param {object} config - VolumeConfig
 * @param {string} chapterNumber - Chapter number to export (e.g., "1", "B1")
 * @param {boolean} [includeFrontMatter=false] - Include front matter
 * @param {boolean} [includeBackMatter=false] - Include back matter
 * @returns {object} Export result
 */
function exportChapter(config, chapterNumber, includeFrontMatter = false, includeBackMatter = false) {
  return exportToMarkdown(config, {
    chapterNumber,
    includeFrontMatter,
    includeBackMatter,
  });
}

/**
 * Exports the entire volume to markdown.
 * Convenience function for full volume export.
 *
 * @param {object} config - VolumeConfig
 * @param {boolean} [includeFrontMatter=true] - Include front matter
 * @param {boolean} [includeBackMatter=true] - Include back matter
 * @returns {object} Export result
 */
function exportVolume(config, includeFrontMatter = true, includeBackMatter = true) {
  return exportToMarkdown(config, {
    chapterNumber: null,
    includeFrontMatter,
    includeBackMatter,
  });
}

/**
 * Exports the volume to EPUB format.
 * Requires the epub-exporter module.
 *
 * @param {object} config - VolumeConfig
 * @param {Array} chapters - Processed chapter objects
 * @param {object} options - Export options
 * @param {string} [options.outputPath] - Output file path
 * @param {boolean} [options.includeFrontMatter=true] - Include front matter
 * @param {boolean} [options.includeBackMatter=true] - Include back matter
 * @returns {Promise<string>} Path to the generated EPUB file
 */
async function exportVolumeToEPUB(config, chapters, options = {}) {
  const { exportToEPUB } = require('./epub-exporter');
  return exportToEPUB(config, chapters, options);
}

/**
 * Exports a single chapter to EPUB format.
 *
 * @param {object} config - VolumeConfig
 * @param {object} chapter - Chapter object
 * @param {object} options - Export options
 * @returns {Promise<string>} Path to the generated EPUB file
 */
async function exportChapterToEPUB(config, chapter, options = {}) {
  const { exportChapterToEPUB: exportSingleChapter } = require('./epub-exporter');
  return exportSingleChapter(config, chapter, options);
}

/**
 * Exports the volume to DOCX format.
 * Requires the docx-exporter module.
 *
 * @param {object} config - VolumeConfig
 * @param {Array} chapters - Processed chapter objects
 * @param {object} options - Export options
 * @param {string} [options.outputPath] - Output file path
 * @param {boolean} [options.includeFrontMatter=true] - Include front matter (title page)
 * @returns {Promise<string>} Path to the generated DOCX file
 */
async function exportVolumeToDOCX(config, chapters, options = {}) {
  const { exportToDOCX } = require('./docx-exporter');
  return exportToDOCX(config, chapters, options);
}

/**
 * Exports a single chapter to DOCX format.
 *
 * @param {object} config - VolumeConfig
 * @param {object} chapter - Chapter object
 * @param {object} options - Export options
 * @returns {Promise<string>} Path to the generated DOCX file
 */
async function exportChapterToDOCX(config, chapter, options = {}) {
  const { exportChapterToDOCX: exportSingleChapter } = require('./docx-exporter');
  return exportSingleChapter(config, chapter, options);
}

/**
 * Compiles a volume from chapter files according to the provided configuration.
 *
 * @param {object} config - VolumeConfig
 * @param {string} config.author
 * @param {string} config.bookTitle
 * @param {string} config.bookSubtitle
 * @param {string} config.volume
 * @param {string} config.edition
 * @param {string} config.publisher
 * @param {string} config.cefr
 * @param {string} config.year
 * @param {string} config.chaptersDir
 * @param {string} config.outputDir
 * @param {Array}  config.chapterManifest
 * @returns {object} CompilationResult
 */
function compileVolume(config) {
  const errors = [];

  // Create output directory if it doesn't exist
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }

  // Build manifest and get ordered chapters that exist on disk
  const manifest = new ChapterManifest(config.chapterManifest);
  const orderedChapters = manifest.getOrderedChapters(config.chaptersDir);

  // Process each chapter: extract markdown and count words
  const chapters = [];
  for (const meta of orderedChapters) {
    const filePath = path.join(config.chaptersDir, meta.file);
    try {
      const content = extractMarkdownFromFile(filePath);
      const words = countWords(content);
      chapters.push({
        file: meta.file,
        num: meta.num,
        title: meta.title,
        titleEn: meta.titleEn,
        type: meta.type,
        content,
        words,
      });
    } catch (err) {
      const msg = `Failed to process chapter ${meta.file}: ${err.message}`;
      console.warn(`[VolumeCompiler] ${msg}`);
      errors.push(msg);
    }
  }

  // Assemble manuscript
  const frontMatter = generateFrontMatter(config, chapters);
  const toc = generateTableOfContents(chapters);
  const chapterContent = chapters
    .map(ch => ch.content)
    .join('\n\n---\n\n');
  const backMatter = generateBackMatter(config);

  const markdownOutput = frontMatter + toc + chapterContent + backMatter;

  // Determine output file paths
  const volumeSlug = config.volume
    ? config.volume.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    : 'volume';
  const mdFileName = `manuscript_${volumeSlug}.md`;
  const htmlFileName = `manuscript_${volumeSlug}.html`;
  const mdPath = path.join(config.outputDir, mdFileName);
  const htmlPath = path.join(config.outputDir, htmlFileName);

  // Write markdown output
  fs.writeFileSync(mdPath, markdownOutput, 'utf8');

  // HTML generation is a stub (will be implemented in tasks 3.1–3.3)
  const htmlOutput = `<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"><title>${config.bookTitle}</title></head>\n<body>\n<!-- HTML conversion pending (task 3.1) -->\n</body>\n</html>\n`;
  fs.writeFileSync(htmlPath, htmlOutput, 'utf8');

  const totalWords = chapters.reduce((sum, ch) => sum + ch.words, 0);

  return {
    success: errors.length === 0,
    totalWords,
    totalChapters: chapters.length,
    outputFiles: {
      markdown: mdPath,
      html: htmlPath,
    },
    errors,
  };
}

module.exports = {
  compileVolume,
  countWords,
  generateFrontMatter,
  generateTableOfContents,
  generateBackMatter,
  exportToMarkdown,
  exportChapter,
  exportVolume,
  exportVolumeToEPUB,
  exportChapterToEPUB,
  exportVolumeToDOCX,
  exportChapterToDOCX,
};
