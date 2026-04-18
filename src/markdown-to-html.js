/**
 * Markdown to HTML Converter
 * Converts markdown syntax to HTML elements for print-ready output.
 */

/**
 * Escapes HTML special characters in a string.
 * @param {string} text
 * @returns {string}
 */
function escapeHTML(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Converts inline markdown (bold, italic, code) within a line of text.
 * Assumes HTML entities are already escaped.
 * @param {string} text
 * @returns {string}
 */
function convertInline(text) {
  // Bold: **text**
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic: *text* (not preceded/followed by another *)
  text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  // Inline code: `text`
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  return text;
}

/**
 * Converts a pipe-syntax markdown table to an HTML table.
 * @param {string[]} lines - The lines making up the table block
 * @returns {string}
 */
function convertTable(lines) {
  const rows = lines.map(line =>
    line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim())
  );

  // Second row is the separator (---|---), skip it
  const headerCells = rows[0];
  const bodyRows = rows.slice(2);

  const thead = '<thead><tr>' +
    headerCells.map(cell => `<th>${convertInline(cell)}</th>`).join('') +
    '</tr></thead>';

  const tbody = '<tbody>' +
    bodyRows.map(row =>
      '<tr>' + row.map(cell => `<td>${convertInline(cell)}</td>`).join('') + '</tr>'
    ).join('') +
    '</tbody>';

  return `<table>${thead}${tbody}</table>`;
}

/**
 * Converts markdown content to HTML.
 * @param {string} markdown
 * @returns {string}
 */
function markdownToHTML(markdown) {
  // Step 1: Escape HTML entities
  let text = escapeHTML(markdown);

  const lines = text.split('\n');
  const output = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Step 2: Headings
    const h4 = line.match(/^#### (.+)/);
    const h3 = line.match(/^### (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h1 = line.match(/^# (.+)/);

    if (h4) {
      output.push(`<h4>${convertInline(h4[1])}</h4>`);
      i++;
      continue;
    }
    if (h3) {
      output.push(`<h3>${convertInline(h3[1])}</h3>`);
      i++;
      continue;
    }
    if (h2) {
      output.push(`<h2>${convertInline(h2[1])}</h2>`);
      i++;
      continue;
    }
    if (h1) {
      output.push(`<h1>${convertInline(h1[1])}</h1>`);
      i++;
      continue;
    }

    // Step 5: Blockquotes
    if (line.match(/^&gt; /)) {
      const content = line.replace(/^&gt; /, '');
      output.push(`<blockquote><p>${convertInline(content)}</p></blockquote>`);
      i++;
      continue;
    }

    // Step 6: Horizontal rules
    if (line.match(/^---$/)) {
      output.push('<hr class="page-break">');
      i++;
      continue;
    }

    // Step 7: Tables — collect all consecutive table lines
    if (line.match(/^\|/)) {
      const tableLines = [];
      while (i < lines.length && lines[i].match(/^\|/)) {
        tableLines.push(lines[i]);
        i++;
      }
      if (tableLines.length >= 2) {
        output.push(convertTable(tableLines));
      }
      continue;
    }

    // Step 8: Unordered lists — collect consecutive items
    if (line.match(/^- /)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^- /)) {
        const content = lines[i].replace(/^- /, '');
        items.push(`<li>${convertInline(content)}</li>`);
        i++;
      }
      output.push('<ul>' + items.join('') + '</ul>');
      continue;
    }

    // Step 8: Ordered lists — collect consecutive items
    if (line.match(/^\d+\. /)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        const content = lines[i].replace(/^\d+\. /, '');
        items.push(`<li>${convertInline(content)}</li>`);
        i++;
      }
      output.push('<ol>' + items.join('') + '</ol>');
      continue;
    }

    // Step 9: Paragraphs — collect non-empty lines separated by blank lines
    if (line.trim() !== '') {
      const paraLines = [];
      while (i < lines.length && lines[i].trim() !== '') {
        paraLines.push(convertInline(lines[i]));
        i++;
      }
      output.push('<p>' + paraLines.join(' ') + '</p>');
      continue;
    }

    // Blank line — skip
    i++;
  }

  return output.join('\n');
}

module.exports = { markdownToHTML };
