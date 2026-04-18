/**
 * Multi-Volume Manager
 * Manages compilation of multiple book volumes in a single project.
 * Scans for config_vol{N}.json files and compiles each volume independently.
 */

const fs = require('fs');
const path = require('path');

const { loadConfigForVolume } = require('./volume-config');
const { compileVolume } = require('./volume-compiler');

/**
 * Scans baseDir for config_vol{N}.json files and returns sorted volume numbers.
 *
 * @param {string} baseDir - Directory to scan for volume config files
 * @returns {number[]} Sorted array of volume numbers found
 */
function listAvailableVolumes(baseDir) {
  let entries;
  try {
    entries = fs.readdirSync(baseDir);
  } catch (err) {
    return [];
  }

  const volumeNumbers = [];
  const pattern = /^config_vol(\d+)\.json$/;

  for (const entry of entries) {
    const match = entry.match(pattern);
    if (match) {
      volumeNumbers.push(parseInt(match[1], 10));
    }
  }

  return volumeNumbers.sort((a, b) => a - b);
}

/**
 * Compiles a single volume by number, returning a MultiVolumeResult.
 *
 * @param {number} volumeNumber
 * @param {string} baseDir
 * @returns {{ volumeNumber: number, configFile: string, result: object|null, error: string|null }}
 */
function compileSingleVolume(volumeNumber, baseDir) {
  const configFile = path.join(baseDir, `config_vol${volumeNumber}.json`);
  console.log(`[VolumeManager] Compiling volume ${volumeNumber}...`);

  try {
    const config = loadConfigForVolume(volumeNumber, baseDir);
    const result = compileVolume(config);
    return { volumeNumber, configFile, result, error: null };
  } catch (err) {
    return { volumeNumber, configFile, result: null, error: err.message };
  }
}

/**
 * Compiles all volumes found in baseDir.
 * Each volume is compiled independently — one failure does not stop others.
 *
 * @param {string} baseDir - Directory containing config_vol{N}.json files
 * @returns {Array<{ volumeNumber: number, configFile: string, result: object|null, error: string|null }>}
 */
function compileAllVolumes(baseDir) {
  const volumeNumbers = listAvailableVolumes(baseDir);
  return volumeNumbers.map(n => compileSingleVolume(n, baseDir));
}

/**
 * Compiles only the specified volumes.
 * Each volume is compiled independently — one failure does not stop others.
 *
 * @param {number[]} volumeNumbers - Array of volume numbers to compile
 * @param {string} baseDir - Directory containing config_vol{N}.json files
 * @returns {Array<{ volumeNumber: number, configFile: string, result: object|null, error: string|null }>}
 */
function compileVolumes(volumeNumbers, baseDir) {
  return volumeNumbers.map(n => compileSingleVolume(n, baseDir));
}

module.exports = {
  listAvailableVolumes,
  compileAllVolumes,
  compileVolumes,
};
