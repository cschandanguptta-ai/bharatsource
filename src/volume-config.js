/**
 * Volume Configuration System
 * Loads, validates, and merges volume compiler configuration files.
 * Supports config_vol{N}.json files with defaults fallback,
 * environment variable overrides, and command-line argument overrides.
 */

const fs = require('fs');
const path = require('path');

/** Default configuration values used when fields are absent from the config file. */
const DEFAULTS = {
  author: 'Unknown Author',
  bookTitle: 'Untitled Book',
  bookSubtitle: '',
  volume: 'Volume 1',
  edition: 'First Edition',
  publisher: 'Self-Published',
  cefr: 'A1-A2',
  year: String(new Date().getFullYear()),
  chaptersDir: './chapters',
  outputDir: './output',
  chapterManifest: [],
  output: {
    formats: ['md', 'html'],
    outputDir: './output',
    fileNames: {
      md: 'manuscript_v1.md',
      html: 'manuscript_v1.html',
    },
  },
  quality: {
    targetWordCount: 10000,
    passThreshold: 9000,
    warnThreshold: 7000,
  },
  styling: {
    pageSize: 'A4',
    margins: { top: '2.5cm', right: '2cm', bottom: '2.5cm', left: '2.5cm' },
    fonts: {
      primary: 'Noto Serif Devanagari',
      secondary: 'Source Serif 4',
      mono: 'Consolas',
    },
    colors: {
      primary: '#1A237E',
      text: '#212121',
      background: '#ffffff',
    },
  },
};

/**
 * Required top-level fields that must be present (and non-empty) in a config.
 */
const REQUIRED_FIELDS = ['author', 'bookTitle', 'chaptersDir', 'outputDir'];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Deep-merge `source` into `target`. Arrays are replaced (not concatenated).
 * Returns a new object; neither argument is mutated.
 *
 * @param {object} target
 * @param {object} source
 * @returns {object}
 */
function deepMerge(target, source) {
  const result = Object.assign({}, target);
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = target[key];
    if (
      srcVal !== null &&
      typeof srcVal === 'object' &&
      !Array.isArray(srcVal) &&
      tgtVal !== null &&
      typeof tgtVal === 'object' &&
      !Array.isArray(tgtVal)
    ) {
      result[key] = deepMerge(tgtVal, srcVal);
    } else {
      result[key] = srcVal;
    }
  }
  return result;
}

/**
 * Parse command-line arguments from process.argv looking for
 * --key="value" or --key=value patterns.
 *
 * @returns {{ author?: string, outputDir?: string, [key: string]: string }}
 */
function parseArgvOverrides() {
  const overrides = {};
  const args = (typeof process !== 'undefined' && process.argv) ? process.argv.slice(2) : [];
  for (const arg of args) {
    const match = arg.match(/^--([a-zA-Z][a-zA-Z0-9_]*)=["']?(.+?)["']?$/);
    if (match) {
      overrides[match[1]] = match[2];
    }
  }
  return overrides;
}

/**
 * Apply environment variable and command-line overrides to a config object.
 * Supported env vars: LEKHAK_AUTHOR, LEKHAK_OUTPUT_DIR
 * Supported CLI args: --author="Name", --outputDir="path"
 *
 * @param {object} config
 * @returns {object} New config with overrides applied
 */
function applyOverrides(config) {
  const result = Object.assign({}, config);

  // Environment variable overrides
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.LEKHAK_AUTHOR) {
      result.author = process.env.LEKHAK_AUTHOR;
    }
    if (process.env.LEKHAK_OUTPUT_DIR) {
      result.outputDir = process.env.LEKHAK_OUTPUT_DIR;
      // Keep output.outputDir in sync if it exists
      if (result.output && typeof result.output === 'object') {
        result.output = Object.assign({}, result.output, { outputDir: process.env.LEKHAK_OUTPUT_DIR });
      }
    }
  }

  // Command-line argument overrides
  const argv = parseArgvOverrides();
  if (argv.author) {
    result.author = argv.author;
  }
  if (argv.outputDir) {
    result.outputDir = argv.outputDir;
    if (result.output && typeof result.output === 'object') {
      result.output = Object.assign({}, result.output, { outputDir: argv.outputDir });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Merge a partial config object with the built-in defaults.
 * Missing fields are filled in from DEFAULTS; nested objects are deep-merged.
 *
 * @param {object} partialConfig
 * @returns {object} Complete VolumeConfig
 */
function mergeWithDefaults(partialConfig) {
  return deepMerge(DEFAULTS, partialConfig || {});
}

/**
 * Validate a config object.
 * Checks that all required fields are present and non-empty strings.
 *
 * @param {object} config
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateConfig(config) {
  const errors = [];

  if (!config || typeof config !== 'object') {
    return { valid: false, errors: ['Config must be a non-null object'] };
  }

  for (const field of REQUIRED_FIELDS) {
    const value = config[field];
    if (value === undefined || value === null || String(value).trim() === '') {
      errors.push(`Missing required field: "${field}"`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Load a volume configuration from a JSON file.
 * Merges with defaults, applies env/CLI overrides, then validates.
 * Throws an error if the file cannot be read or the config is invalid.
 *
 * @param {string} configPath - Absolute or relative path to the JSON config file
 * @returns {object} Validated VolumeConfig
 */
function loadConfig(configPath) {
  let raw;
  try {
    raw = fs.readFileSync(configPath, 'utf8');
  } catch (err) {
    throw new Error(`[VolumeConfig] Cannot read config file "${configPath}": ${err.message}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`[VolumeConfig] Invalid JSON in config file "${configPath}": ${err.message}`);
  }

  const merged = mergeWithDefaults(parsed);
  const withOverrides = applyOverrides(merged);
  const { valid, errors } = validateConfig(withOverrides);

  if (!valid) {
    throw new Error(
      `[VolumeConfig] Configuration in "${configPath}" is invalid:\n  - ${errors.join('\n  - ')}`
    );
  }

  return withOverrides;
}

/**
 * Locate and load the config file for a specific volume number.
 * Looks for `config_vol{N}.json` in baseDir (defaults to process.cwd()).
 *
 * @param {number} volumeNumber - The volume number (e.g. 1 for config_vol1.json)
 * @param {string} [baseDir] - Directory to search in (defaults to process.cwd())
 * @returns {object} Validated VolumeConfig
 */
function loadConfigForVolume(volumeNumber, baseDir) {
  const dir = baseDir || (typeof process !== 'undefined' ? process.cwd() : '.');
  const fileName = `config_vol${volumeNumber}.json`;
  const configPath = path.join(dir, fileName);
  return loadConfig(configPath);
}

module.exports = {
  loadConfig,
  loadConfigForVolume,
  mergeWithDefaults,
  validateConfig,
};
