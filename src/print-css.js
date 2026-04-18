/**
 * Print CSS Generator
 * Generates A4-optimized CSS for print/PDF output.
 */

/**
 * @typedef {Object} PrintCSSConfig
 * @property {string} [pageSize]
 * @property {{ top: string, right: string, bottom: string, left: string }} [margins]
 * @property {{ primary: string, secondary: string, mono: string }} [fonts]
 * @property {string} [baseFontSize]
 * @property {number} [lineHeight]
 * @property {{ primary: string, secondary: string, text: string, background: string }} [colors]
 */

const DEFAULTS = {
  pageSize: 'A4',
  margins: { top: '2.5cm', right: '2cm', bottom: '2.5cm', left: '2.5cm' },
  fonts: {
    primary: 'Noto Serif Devanagari',
    secondary: 'Source Serif 4',
    mono: 'Consolas',
  },
  baseFontSize: '11pt',
  lineHeight: 1.75,
  colors: {
    primary: '#1A237E',
    secondary: '#3949AB',
    text: '#212121',
    background: '#ffffff',
  },
};

/**
 * Returns the Google Fonts import URL for the three required fonts.
 * @returns {string}
 */
function getGoogleFontsURL() {
  return 'https://fonts.googleapis.com/css2?family=Noto+Serif+Devanagari:wght@400;700&family=Source+Serif+4:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;600&display=swap';
}

/**
 * Generates print-optimized CSS for A4 layout.
 * @param {PrintCSSConfig} [config]
 * @returns {string}
 */
function getPrintCSS(config = {}) {
  const margins = { ...DEFAULTS.margins, ...(config.margins || {}) };
  const fonts = { ...DEFAULTS.fonts, ...(config.fonts || {}) };
  const colors = { ...DEFAULTS.colors, ...(config.colors || {}) };
  const baseFontSize = config.baseFontSize || DEFAULTS.baseFontSize;
  const lineHeight = config.lineHeight != null ? config.lineHeight : DEFAULTS.lineHeight;
  const fontsURL = getGoogleFontsURL();

  return `@import url('${fontsURL}');

/* ===== Page Setup ===== */
@page {
  size: A4;
  margin: ${margins.top} ${margins.right} ${margins.bottom} ${margins.left};
}

/* ===== Base Styles ===== */
body {
  font-family: '${fonts.secondary}', '${fonts.primary}', serif;
  font-size: ${baseFontSize};
  line-height: ${lineHeight};
  color: ${colors.text};
  background: ${colors.background};
  text-align: justify;
  word-spacing: 0.05em;
}

/* ===== Headings ===== */
h1, h2, h3, h4 {
  font-family: 'Inter', '${fonts.secondary}', sans-serif;
  color: ${colors.primary};
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  line-height: 1.3;
}

h1 { font-size: 22pt; }
h2 { font-size: 16pt; }
h3 { font-size: 13pt; }
h4 { font-size: 11pt; font-weight: bold; }

/* ===== Paragraphs ===== */
p {
  margin: 0.6em 0;
}

/* ===== Page Breaks ===== */
.chapter {
  page-break-before: always;
}

hr.page-break {
  display: none;
}

hr.page-break + * {
  page-break-before: always;
}

/* ===== Tables ===== */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
  page-break-inside: avoid;
  font-size: 10pt;
}

th, td {
  border: 1px solid #cccccc;
  padding: 0.4em 0.6em;
  text-align: left;
}

thead tr {
  background-color: ${colors.primary};
  color: #ffffff;
}

tbody tr:nth-child(even) {
  background-color: #f9f9f9;
}

/* ===== Blockquotes ===== */
blockquote {
  background: #f0f4ff;
  border-left: 4px solid ${colors.primary};
  margin: 1em 0;
  padding: 0.75em 1em;
  font-style: italic;
}

blockquote p {
  margin: 0;
}

/* ===== Code ===== */
code {
  font-family: ${fonts.mono}, 'Courier New', monospace;
  background: #f5f5f5;
  padding: 0.1em 0.3em;
  border-radius: 2px;
  font-size: 0.9em;
}

pre {
  font-family: ${fonts.mono}, 'Courier New', monospace;
  background: #f5f5f5;
  padding: 0.75em 1em;
  overflow-x: auto;
  page-break-inside: avoid;
  font-size: 9.5pt;
  line-height: 1.5;
}

pre code {
  background: none;
  padding: 0;
}

/* ===== Lists ===== */
ul, ol {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

li {
  margin: 0.25em 0;
}

/* ===== Horizontal Rule ===== */
hr:not(.page-break) {
  border: none;
  border-top: 1px solid #cccccc;
  margin: 1.5em 0;
}

/* ===== Print Toolbar ===== */
.print-toolbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: ${colors.primary};
  color: #ffffff;
  padding: 0.5em 1em;
  display: flex;
  align-items: center;
  gap: 1em;
  z-index: 1000;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
}

.print-toolbar button {
  background: #ffffff;
  color: ${colors.primary};
  border: none;
  padding: 0.4em 1em;
  cursor: pointer;
  font-weight: 600;
  border-radius: 3px;
}

/* ===== Screen Preview ===== */
@media screen {
  body {
    background: #e0e0e0;
    margin: 0;
    padding: 0;
  }

  .book-container {
    max-width: 800px;
    margin: 2em auto;
    background: #ffffff;
    padding: 3cm 2.5cm;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.18);
  }

  body.has-toolbar .book-container {
    margin-top: 4em;
  }
}

/* ===== Print Output ===== */
@media print {
  body {
    background: none;
    margin: 0;
    padding: 0;
  }

  .book-container {
    max-width: none;
    margin: 0;
    padding: 0;
    box-shadow: none;
  }

  .print-toolbar {
    display: none;
  }
}
`;
}

module.exports = { getPrintCSS, getGoogleFontsURL };
