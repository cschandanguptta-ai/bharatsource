/**
 * HTML Output Generator
 * Assembles the final complete HTML document from all components.
 */

const { markdownToHTML } = require('./markdown-to-html');
const { getPrintCSS } = require('./print-css');

/**
 * Generates a complete HTML document from markdown content and volume config.
 *
 * @param {string} markdownContent - Full compiled markdown content
 * @param {object} config - VolumeConfig with at least { bookTitle }
 * @returns {string} Complete HTML document string
 */
function generateHTML(markdownContent, config) {
  const bodyHTML = markdownToHTML(markdownContent);
  const css = getPrintCSS(config);
  const title = (config && config.bookTitle) ? config.bookTitle : 'Book';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
${css}
  </style>
</head>
<body class="has-toolbar">
  <div class="print-toolbar">
    <button onclick="window.print()">&#x1F5A8; Print / Save PDF</button>
    <span>Ctrl+P &rarr; Save as PDF &rarr; A4 paper &rarr; No margins</span>
  </div>
  <div class="book-container">
${bodyHTML}
  </div>
</body>
</html>`;
}

module.exports = { generateHTML };
