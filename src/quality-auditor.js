/**
 * Quality Auditor
 * Validates manuscript quality against publishing standards.
 * Implements Requirement 7 (Quality Auditing System).
 */

const { countWords } = require('./word-counter');
const { validateChapter } = require('./structure-validator');

const DEFAULT_CONFIG = {
  targetWordCount: 10000,
  passThreshold: 9000,
  warnThreshold: 7000
};

/**
 * Build an ASCII progress bar for a given ratio.
 * e.g. "[████████░░] 80%"
 *
 * @param {number} words
 * @param {number} target
 * @returns {string}
 */
function buildProgressBar(words, target) {
  const BAR_WIDTH = 10;
  const ratio = target > 0 ? Math.min(words / target, 1) : 0;
  const filled = Math.round(ratio * BAR_WIDTH);
  const empty = BAR_WIDTH - filled;
  const pct = Math.round(ratio * 100);
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${pct}%`;
}

/**
 * Determine chapter status based on word count and thresholds.
 *
 * @param {number} words
 * @param {number} passThreshold
 * @param {number} warnThreshold
 * @returns {'PASS'|'NEAR'|'LOW'}
 */
function getStatus(words, passThreshold, warnThreshold) {
  if (words >= passThreshold) return 'PASS';
  if (words >= warnThreshold) return 'NEAR';
  return 'LOW';
}

/**
 * Run a quality audit over an array of chapters.
 *
 * @param {Array<{num: string, content: string, [key: string]: any}>} chapters
 * @param {object} [config]
 * @param {number} [config.targetWordCount=10000]
 * @param {number} [config.passThreshold=9000]
 * @param {number} [config.warnThreshold=7000]
 * @returns {{ allPass: boolean, totalWords: number, chapterResults: object[], summary: { pass: number, near: number, low: number } }}
 */
function runAudit(chapters, config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const { targetWordCount, passThreshold, warnThreshold } = cfg;

  if (!Array.isArray(chapters)) {
    return {
      allPass: false,
      totalWords: 0,
      chapterResults: [],
      summary: { pass: 0, near: 0, low: 0 }
    };
  }

  let totalWords = 0;
  const summary = { pass: 0, near: 0, low: 0 };

  const chapterResults = chapters.map(chapter => {
    const content = chapter.content || '';
    const words = countWords(content);
    totalWords += words;

    const gap = targetWordCount - words;
    const status = getStatus(words, passThreshold, warnThreshold);
    summary[status.toLowerCase()]++;

    const progressBar = buildProgressBar(words, targetWordCount);

    const validation = validateChapter(content);
    const checks = validation.checks || {};

    return {
      chapterNum: chapter.num !== undefined ? String(chapter.num) : '',
      words,
      targetWords: targetWordCount,
      gap,
      status,
      progressBar,
      hasErrorLab: Boolean(checks.hasErrorLab),
      hasPractice: Boolean(checks.hasPractice),
      hasContrast: Boolean(checks.hasContrast),
      hasSections: Boolean(checks.hasSections)
    };
  });

  const allPass = chapterResults.every(r => r.status === 'PASS');

  return { allPass, totalWords, chapterResults, summary };
}

/**
 * Format an AuditReport as a human-readable summary table string.
 *
 * @param {{ allPass: boolean, totalWords: number, chapterResults: object[], summary: { pass: number, near: number, low: number } }} report
 * @returns {string}
 */
function formatAuditReport(report) {
  if (!report || !Array.isArray(report.chapterResults)) {
    return 'No audit data available.';
  }

  const lines = [];
  lines.push('=== Quality Audit Report ===');
  lines.push('');

  // Header row
  const header = 'Ch   | Words  | Target | Gap    | Status | Progress           | ErrLab | Practice | Contrast | Sections';
  const divider = '-'.repeat(header.length);
  lines.push(header);
  lines.push(divider);

  for (const r of report.chapterResults) {
    const ch = String(r.chapterNum).padEnd(4);
    const words = String(r.words).padStart(6);
    const target = String(r.targetWords).padStart(6);
    const gap = String(r.gap).padStart(6);
    const status = r.status.padEnd(6);
    const bar = r.progressBar.padEnd(18);
    const errLab = r.hasErrorLab ? '  ✓   ' : '  ✗   ';
    const practice = r.hasPractice ? '   ✓    ' : '   ✗    ';
    const contrast = r.hasContrast ? '   ✓      ' : '   ✗      ';
    const sections = r.hasSections ? '   ✓' : '   ✗';
    lines.push(`${ch} | ${words} | ${target} | ${gap} | ${status} | ${bar} |${errLab}|${practice}|${contrast}|${sections}`);
  }

  lines.push(divider);
  lines.push('');
  lines.push(`Total Words : ${report.totalWords}`);
  lines.push(`Summary     : PASS=${report.summary.pass}  NEAR=${report.summary.near}  LOW=${report.summary.low}`);
  lines.push(`Overall     : ${report.allPass ? '✓ ALL PASS' : '✗ SOME CHAPTERS NEED ATTENTION'}`);

  return lines.join('\n');
}

module.exports = { runAudit, formatAuditReport };
