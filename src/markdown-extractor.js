/**
 * Markdown Extraction Engine
 * Extracts markdown content from JavaScript chapter files with embedded template literals.
 * Supports the LEKHAK_REPOSITORY pattern used in the Book-Writing System.
 */

const fs = require('fs');

/**
 * Extracts markdown content from a JavaScript file string.
 *
 * Algorithm:
 * 1. Search for LEKHAK_REPOSITORY["key"] = ` pattern
 * 2. Find opening backtick after equals sign
 * 3. Scan backward from end of file to find closing backtick
 * 4. Extract substring between opening and closing backticks
 * 5. Fallback: Search for .content = ` pattern
 * 6. Fallback: Find largest backtick-delimited block > 1000 chars
 *
 * @param {string} jsContent - JavaScript file content as string
 * @param {string} [fileName] - Optional file name for error messages
 * @returns {string} Extracted markdown content
 * @throws {Error} If no valid template literal found
 */
function extractMarkdown(jsContent, fileName = '<unknown>') {
  if (typeof jsContent !== 'string') {
    throw new Error(`[${fileName}] Expected string content, got ${typeof jsContent}`);
  }

  // Strategy 1: LEKHAK_REPOSITORY["key"] = ` or LEKHAK_REPOSITORY['key'] = `
  const repoPattern = /LEKHAK_REPOSITORY\s*\[['"][^\]'"]+['"]\]\s*=\s*`/;
  const repoMatch = repoPattern.exec(jsContent);
  if (repoMatch) {
    const openPos = repoMatch.index + repoMatch[0].length; // position right after opening backtick
    const content = extractFromOpenPos(jsContent, openPos, fileName, 'LEKHAK_REPOSITORY pattern');
    if (content !== null) return content;
  }

  // Strategy 2: .content = ` pattern
  const contentPattern = /\.content\s*=\s*`/;
  const contentMatch = contentPattern.exec(jsContent);
  if (contentMatch) {
    const openPos = contentMatch.index + contentMatch[0].length;
    const content = extractFromOpenPos(jsContent, openPos, fileName, '.content pattern');
    if (content !== null) return content;
  }

  // Strategy 3: Find largest backtick-delimited block > 1000 chars
  const largest = findLargestTemplateLiteral(jsContent);
  if (largest !== null && largest.length > 1000) {
    return largest;
  }

  throw new Error(
    `[${fileName}] Failed to extract markdown: no valid template literal found. ` +
    `Tried LEKHAK_REPOSITORY pattern, .content pattern, and largest block fallback.`
  );
}

/**
 * Given the position immediately after an opening backtick, scans backward from
 * the end of the file to find the matching closing backtick, then extracts content.
 *
 * Scanning backward avoids issues with nested template literals and comments
 * containing backticks — we want the LAST unescaped backtick in the file.
 *
 * @param {string} jsContent - Full file content
 * @param {number} openPos - Index of first character inside the template literal
 * @param {string} fileName - For error messages
 * @param {string} patternName - For error messages
 * @returns {string|null} Extracted content or null if not found
 */
function extractFromOpenPos(jsContent, openPos, fileName, patternName) {
  // Scan backward from end of file to find the last unescaped backtick
  for (let i = jsContent.length - 1; i >= openPos; i--) {
    if (jsContent[i] === '`' && !isEscaped(jsContent, i)) {
      // Found closing backtick
      return jsContent.slice(openPos, i);
    }
  }
  return null;
}

/**
 * Checks whether the character at `pos` is escaped (preceded by odd number of backslashes).
 *
 * @param {string} str - The string
 * @param {number} pos - Position to check
 * @returns {boolean}
 */
function isEscaped(str, pos) {
  let backslashes = 0;
  let i = pos - 1;
  while (i >= 0 && str[i] === '\\') {
    backslashes++;
    i--;
  }
  return backslashes % 2 === 1;
}

/**
 * Finds the largest template literal block in the file by scanning for
 * unescaped backtick pairs and returning the content of the largest one.
 *
 * @param {string} jsContent - Full file content
 * @returns {string|null} Content of the largest template literal, or null
 */
function findLargestTemplateLiteral(jsContent) {
  const blocks = [];
  let inTemplate = false;
  let start = -1;

  for (let i = 0; i < jsContent.length; i++) {
    if (jsContent[i] === '`' && !isEscaped(jsContent, i)) {
      if (!inTemplate) {
        inTemplate = true;
        start = i + 1; // content starts after opening backtick
      } else {
        // closing backtick
        blocks.push(jsContent.slice(start, i));
        inTemplate = false;
        start = -1;
      }
    }
  }

  if (blocks.length === 0) return null;

  // Return the largest block
  return blocks.reduce((a, b) => (b.length > a.length ? b : a), '');
}

/**
 * Reads a file and extracts its markdown content.
 *
 * @param {string} filePath - Path to the JavaScript chapter file
 * @returns {string} Extracted markdown content
 * @throws {Error} If file cannot be read or extraction fails
 */
function extractMarkdownFromFile(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    throw new Error(`[${filePath}] Failed to read file: ${err.message}`);
  }

  const fileName = filePath.split(/[\\/]/).pop();
  return extractMarkdown(content, fileName);
}

module.exports = {
  extractMarkdown,
  extractMarkdownFromFile,
};
