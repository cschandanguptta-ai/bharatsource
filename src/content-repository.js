/**
 * Content Repository Manager
 * Manages the LEKHAK_REPOSITORY global object for storing chapter content.
 * Supports both browser (window) and Node.js environments.
 */

// Determine the global object for the current environment
const _global = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});

/**
 * Initializes the LEKHAK_REPOSITORY if it does not already exist.
 * Safe to call multiple times — will not overwrite existing data.
 */
function initRepository() {
  if (!_global.LEKHAK_REPOSITORY) {
    _global.LEKHAK_REPOSITORY = {};
  }
}

/**
 * Registers chapter content under the given key.
 * Warns if the key already exists (duplicate), then overwrites with the new content.
 *
 * @param {string} key - Unique chapter key (e.g., "v1_c1")
 * @param {string} content - Markdown content for the chapter
 */
function registerChapter(key, content) {
  initRepository();

  if (Object.prototype.hasOwnProperty.call(_global.LEKHAK_REPOSITORY, key)) {
    console.warn(
      `[ContentRepository] Duplicate key detected: "${key}". ` +
      `Existing content will be overwritten with the latest registration.`
    );
  }

  _global.LEKHAK_REPOSITORY[key] = content;
}

/**
 * Retrieves chapter content by key.
 *
 * @param {string} key - Chapter key to look up
 * @returns {string|undefined} The chapter content, or undefined if not found
 */
function getChapter(key) {
  initRepository();
  return _global.LEKHAK_REPOSITORY[key];
}

/**
 * Exports the entire repository as a JSON string.
 *
 * @returns {string} JSON representation of all chapter content
 */
function exportRepository() {
  initRepository();
  return JSON.stringify(_global.LEKHAK_REPOSITORY);
}

/**
 * Imports repository content from a JSON string.
 * Merges imported keys into the existing repository, with duplicate warnings.
 *
 * @param {string} json - JSON string representing a ContentRepository object
 * @throws {Error} If the JSON is invalid or does not represent an object
 */
function importRepository(json) {
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    throw new Error(`[ContentRepository] Failed to parse JSON: ${err.message}`);
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('[ContentRepository] Imported JSON must be a plain object mapping keys to content strings.');
  }

  initRepository();

  for (const key of Object.keys(parsed)) {
    if (Object.prototype.hasOwnProperty.call(_global.LEKHAK_REPOSITORY, key)) {
      console.warn(
        `[ContentRepository] Duplicate key on import: "${key}". ` +
        `Existing content will be overwritten.`
      );
    }
    _global.LEKHAK_REPOSITORY[key] = parsed[key];
  }
}

// Initialize on module load
initRepository();

module.exports = {
  initRepository,
  registerChapter,
  getChapter,
  exportRepository,
  importRepository,
};
