/**
 * Structure Validator
 * Validates chapter content for required structural elements and markdown consistency.
 * Implements Requirement 14 (Structure Validation).
 */

/**
 * Validate a single chapter's content for structural requirements.
 *
 * Checks performed:
 *  - hasErrorLab: "Error Lab" or "त्रुटि प्रयोगशाला" present
 *  - hasPractice: "Practice" or "अभ्यास" present
 *  - hasContrast: bilingual headers (Devanagari + English on adjacent lines)
 *  - hasSections: "भाग" or ## section-level headers present
 *  - headingHierarchyValid: no h3 (###) appears before the first h2 (##)
 *  - tablesConsistent: all rows in every table have the same column count
 *
 * @param {string} content - Markdown chapter content
 * @returns {{ passed: boolean, issues: Array<{type: string, message: string, severity: string}>, checks: object }}
 */
function validateChapter(content) {
  const issues = [];
  const checks = {
    hasErrorLab: false,
    hasPractice: false,
    hasContrast: false,
    hasSections: false,
    headingHierarchyValid: true,
    tablesConsistent: true
  };

  if (!content || typeof content !== 'string') {
    issues.push({ type: 'content', message: 'Chapter content is empty or invalid', severity: 'error' });
    return { passed: false, issues, checks };
  }

  // 1. Error Lab section
  checks.hasErrorLab = /Error Lab|त्रुटि प्रयोगशाला/.test(content);
  if (!checks.hasErrorLab) {
    issues.push({
      type: 'missingSection',
      message: 'Missing Error Lab section ("Error Lab" or "त्रुटि प्रयोगशाला")',
      severity: 'warning'
    });
  }

  // 2. Practice exercises
  checks.hasPractice = /Practice|अभ्यास/.test(content);
  if (!checks.hasPractice) {
    issues.push({
      type: 'missingSection',
      message: 'Missing Practice section ("Practice" or "अभ्यास")',
      severity: 'warning'
    });
  }

  // 3. Hindi-English contrast — Devanagari header and English header on adjacent lines
  const lines = content.split('\n');
  const devanagariRange = /[\u0900-\u097F]/;
  const latinAlpha = /[A-Za-z]/;
  let foundContrast = false;
  for (let i = 0; i < lines.length - 1; i++) {
    const curr = lines[i];
    const next = lines[i + 1];
    const currIsHeader = /^#{1,4}\s/.test(curr);
    const nextIsHeader = /^#{1,4}\s/.test(next);
    if (currIsHeader && nextIsHeader &&
        devanagariRange.test(curr) && latinAlpha.test(next)) {
      foundContrast = true;
      break;
    }
    if (currIsHeader && nextIsHeader &&
        latinAlpha.test(curr) && devanagariRange.test(next)) {
      foundContrast = true;
      break;
    }
  }
  checks.hasContrast = foundContrast;
  if (!checks.hasContrast) {
    issues.push({
      type: 'missingContrast',
      message: 'Missing bilingual headers (Devanagari + English on adjacent lines)',
      severity: 'warning'
    });
  }

  // 4. Section headers — "भाग" or ## headings
  checks.hasSections = /भाग/.test(content) || /^##\s/m.test(content);
  if (!checks.hasSections) {
    issues.push({
      type: 'missingSection',
      message: 'Missing section headers ("भाग" or ## headings)',
      severity: 'warning'
    });
  }

  // 5. Heading hierarchy — no h3 (###) before first h2 (##)
  let firstH2Index = -1;
  let firstH3BeforeH2Index = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (firstH2Index === -1 && /^##\s/.test(line) && !/^###/.test(line)) {
      firstH2Index = i;
    }
    if (firstH2Index === -1 && /^###\s/.test(line)) {
      firstH3BeforeH2Index = i;
      break;
    }
  }
  if (firstH3BeforeH2Index !== -1) {
    checks.headingHierarchyValid = false;
    issues.push({
      type: 'headingHierarchy',
      message: `Heading hierarchy violation: h3 (###) appears before any h2 (##) at line ${firstH3BeforeH2Index + 1}`,
      severity: 'error'
    });
  }

  // 6. Table column consistency
  const tableRowRegex = /^\|.+\|/;
  let inTable = false;
  let expectedColumns = -1;
  let tableStartLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (tableRowRegex.test(line)) {
      // Skip separator rows (e.g. |---|---| or |:---|:---:|)
      // A separator row only has dashes, colons, and spaces between pipes
      if (/^\|(\s*:?-+:?\s*\|)+$/.test(line)) {
        continue;
      }
      const cols = line.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).length;
      if (!inTable) {
        inTable = true;
        expectedColumns = cols;
        tableStartLine = i + 1;
      } else if (cols !== expectedColumns) {
        checks.tablesConsistent = false;
        issues.push({
          type: 'tableConsistency',
          message: `Table starting at line ${tableStartLine} has inconsistent column count: expected ${expectedColumns}, got ${cols} at line ${i + 1}`,
          severity: 'error'
        });
      }
    } else {
      inTable = false;
      expectedColumns = -1;
    }
  }

  const passed = issues.filter(i => i.severity === 'error').length === 0;
  return { passed, issues, checks };
}

/**
 * Validate multiple chapters and return results with chapter number attached.
 *
 * @param {Array<{num: string|number, content: string, [key: string]: any}>} chapters
 * @returns {Array<{ chapterNum: string|number, passed: boolean, issues: Array, checks: object }>}
 */
function validateChapters(chapters) {
  if (!Array.isArray(chapters)) return [];
  return chapters.map(chapter => {
    const result = validateChapter(chapter.content || '');
    return {
      chapterNum: chapter.num !== undefined ? chapter.num : null,
      ...result
    };
  });
}

module.exports = { validateChapter, validateChapters };
