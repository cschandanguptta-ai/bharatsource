/**
 * Chapter Manifest Parser
 * Manages the ordered list of chapters for volume compilation.
 * Validates chapter metadata and file existence before compilation.
 */

const fs = require('fs');
const path = require('path');

/**
 * Manages chapter metadata and ordering for a volume.
 *
 * @example
 * const manifest = new ChapterManifest([
 *   { file: 'v1_ch1_alphabet.js', num: '1', title: 'अंग्रेज़ी वर्णमाला', titleEn: 'The English Alphabet', type: 'core' },
 *   { file: 'v1_bonus1_modal.js', num: 'B1', title: 'Modal Auxiliaries', titleEn: 'Modal Auxiliaries', type: 'bonus' }
 * ]);
 * const chapters = manifest.getOrderedChapters('/path/to/chapters');
 */
class ChapterManifest {
  /**
   * @param {Array<{file: string, num: string, title: string, titleEn: string, type: 'core'|'bonus'}>} chapters
   */
  constructor(chapters) {
    if (!Array.isArray(chapters)) {
      throw new Error('ChapterManifest requires an array of chapter metadata objects');
    }
    this._chapters = chapters;
  }

  /**
   * Returns chapters that exist in chaptersDir, in manifest order.
   * Logs a warning and skips any chapter whose file is not found.
   *
   * @param {string} chaptersDir - Absolute or relative path to the chapters directory
   * @returns {Array<{file: string, num: string, title: string, titleEn: string, type: 'core'|'bonus'}>}
   */
  getOrderedChapters(chaptersDir) {
    const available = [];

    for (const chapter of this._chapters) {
      const filePath = path.join(chaptersDir, chapter.file);
      if (fs.existsSync(filePath)) {
        available.push(chapter);
      } else {
        console.warn(
          `[ChapterManifest] Warning: Chapter file not found, skipping — ${chapter.file} ` +
          `(Chapter ${chapter.num}: ${chapter.titleEn})`
        );
      }
    }

    return available;
  }

  /**
   * Returns all core chapters in manifest order (existence not checked).
   *
   * @returns {Array}
   */
  getCoreChapters() {
    return this._chapters.filter(ch => ch.type === 'core');
  }

  /**
   * Returns all bonus chapters in manifest order (existence not checked).
   *
   * @returns {Array}
   */
  getBonusChapters() {
    return this._chapters.filter(ch => ch.type === 'bonus');
  }

  /**
   * Returns the full manifest (all entries, regardless of file existence).
   *
   * @returns {Array}
   */
  getAll() {
    return [...this._chapters];
  }
}

module.exports = { ChapterManifest };
