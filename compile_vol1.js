#!/usr/bin/env node

/**
 * Volume 1 Compiler Script
 * Compiles all chapters from config_vol1.json into manuscript files
 */

const fs = require('fs');
const path = require('path');
const { loadConfig } = require('./src/volume-config');
const { compileVolume } = require('./src/volume-compiler');

// Load configuration
const configPath = path.join(__dirname, 'config_vol1.json');
console.log('📚 Loading configuration from:', configPath);

const config = loadConfig(configPath);
console.log('✅ Configuration loaded successfully');
console.log('   Book:', config.bookTitle);
console.log('   Volume:', config.volume);
console.log('   Author:', config.author);
console.log('   Chapters:', config.chapterManifest.length);

// Compile the volume
console.log('\n🔄 Starting compilation...\n');

const result = compileVolume(config);

if (result.success) {
  console.log('\n✅ Compilation completed successfully!\n');
  console.log('📊 Summary:');
  console.log('   Total chapters compiled:', result.totalChapters);
  console.log('   Total word count:', result.totalWords.toLocaleString());
  console.log('   Output files:');
  
  Object.values(result.outputFiles).forEach(file => {
    const stats = fs.statSync(file);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`      - ${path.basename(file)} (${sizeKB} KB)`);
  });
  
  console.log('\n📁 Output directory:', config.outputDir);
  console.log('\n✨ Ready for review and PDF generation!\n');
} else {
  console.error('\n❌ Compilation failed!');
  console.error('Errors:', result.errors);
  process.exit(1);
}
