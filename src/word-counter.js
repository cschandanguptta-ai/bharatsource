/**
 * Word Counter
 * Counts words in markdown content across Devanagari and Latin scripts.
 * Uses simple whitespace-based tokenization (does not exclude markdown syntax).
 */

/**
 * Count words in a text string by splitting on whitespace.
 * Works for both Devanagari and Latin scripts.
 *
 * @param {string} text - The text to count words in
 * @returns {number} Total word count
 */
function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  return text.split(/[ \t\n\r]+/).filter(token => token.length > 0).length;
}

/**
 * Add word counts to an array of chapter objects.
 *
 * @param {Array<{content: string, [key: string]: any}>} chapters
 * @returns {Array<{content: string, words: number, [key: string]: any}>}
 */
function countWordsInChapters(chapters) {
  if (!Array.isArray(chapters)) return [];
  return chapters.map(chapter => ({
    ...chapter,
    words: countWords(chapter.content || '')
  }));
}

/**
 * Calculate aggregate word count statistics for a volume.
 *
 * @param {Array<{content: string, [key: string]: any}>} chapters
 * @returns {{ totalWords: number, averageWords: number, chapterCount: number }}
 */
function calculateVolumeStats(chapters) {
  if (!Array.isArray(chapters) || chapters.length === 0) {
    return { totalWords: 0, averageWords: 0, chapterCount: 0 };
  }
  const chapterCount = chapters.length;
  const totalWords = chapters.reduce((sum, ch) => sum + countWords(ch.content || ''), 0);
  const averageWords = Math.round(totalWords / chapterCount);
  return { totalWords, averageWords, chapterCount };
}

module.exports = { countWords, countWordsInChapters, calculateVolumeStats };
