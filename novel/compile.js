#!/usr/bin/env node

/**
 * THE LAST ALGORITHM - Novel Compiler
 * Compiles JavaScript chapter files into manuscript formats
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG_PATH = path.join(__dirname, 'config.json');
const CHAPTERS_DIR = path.join(__dirname, 'chapters');
const OUTPUT_DIR = path.join(__dirname, 'output');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Load configuration
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

console.log(`\n📚 Compiling: ${config.title}`);
console.log(`   Author: ${config.author}`);
console.log(`   Target: ${config.wordCountTarget.toLocaleString()} words`);
console.log(`   Chapters: ${config.structure.totalChapters}\n`);

// Extract markdown from chapter files
function extractChapterContent(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Match pattern: window.LEKHAK_REPOSITORY['chapter_X'] = `content`
    const match = content.match(/window\.LEKHAK_REPOSITORY\[[\s\S]*?\]\s*=\s*`([\s\S]*?)`/);
    
    if (match && match[1]) {
      return match[1];
    }
    
    // If no template pattern, return raw content
    return content;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

// Count words in markdown text
function countWords(text) {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Generate table of contents
function generateTOC(chapters) {
  let toc = '# Contents\n\n';
  chapters.forEach((ch, index) => {
    if (ch.title && ch.content) {
      toc += `${index + 1}. [${ch.title}](#chapter-${index + 1})\n`;
    }
  });
  return toc + '\n---\n\n';
}

// Compile manuscript
function compileManuscript() {
  const chapters = [];
  let totalWords = 0;
  
  // Read all chapter files
  if (fs.existsSync(CHAPTERS_DIR)) {
    const files = fs.readdirSync(CHAPTERS_DIR)
      .filter(f => f.endsWith('.js'))
      .sort((a, b) => {
        const numA = parseInt(a.match(/chapter_(\d+)/)?.[1] || 0);
        const numB = parseInt(b.match(/chapter_(\d+)/)?.[1] || 0);
        return numA - numB;
      });
    
    files.forEach(file => {
      const filePath = path.join(CHAPTERS_DIR, file);
      const content = extractChapterContent(filePath);
      
      if (content) {
        const wordCount = countWords(content);
        totalWords += wordCount;
        
        // Extract title from first line if it starts with #
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : file.replace('.js', '').replace(/_/g, ' ').toUpperCase();
        
        chapters.push({
          file,
          title,
          content,
          wordCount
        });
        
        console.log(`✓ ${file}: ${wordCount.toLocaleString()} words`);
      }
    });
  }
  
  console.log(`\n📊 Statistics:`);
  console.log(`   Chapters compiled: ${chapters.length}`);
  console.log(`   Total words: ${totalWords.toLocaleString()}`);
  console.log(`   Progress: ${((totalWords / config.wordCountTarget) * 100).toFixed(1)}%`);
  
  // Generate Markdown manuscript
  if (chapters.length > 0) {
    let manuscript = `# ${config.title}\n\n`;
    manuscript += `## ${config.subtitle}\n\n`;
    manuscript += `### by ${config.author}\n\n`;
    manuscript += `---\n\n`;
    manuscript += generateTOC(chapters);
    
    chapters.forEach((ch, index) => {
      manuscript += `\n<a id="chapter-${index + 1}"></a>\n\n`;
      manuscript += `# Chapter ${index + 1}\n`;
      manuscript += `## ${ch.title}\n\n`;
      manuscript += ch.content.replace(/^#\s+.+$/m, '') + '\n\n';
      manuscript += `---\n\n`;
    });
    
    // Save Markdown
    const mdPath = path.join(OUTPUT_DIR, 'manuscript.md');
    fs.writeFileSync(mdPath, manuscript, 'utf8');
    console.log(`\n✓ Saved: ${mdPath}`);
    
    // Generate HTML version
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.title}</title>
  <style>
    body { 
      font-family: Georgia, serif; 
      max-width: 800px; 
      margin: 0 auto; 
      padding: 20px;
      line-height: 1.6;
    }
    h1, h2, h3 { color: #2c3e50; }
    .chapter { margin-bottom: 60px; }
    .toc { background: #f8f9fa; padding: 20px; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>${config.title}</h1>
  <h2>${config.subtitle}</h2>
  <h3>by ${config.author}</h3>
  <hr>
  ${generateTOC(chapters).replace(/^# Contents/m, '<div class="toc"><h2>Contents</h2>').replace(/\n$/, '</div>')}
  ${chapters.map((ch, i) => `
  <div class="chapter">
    <h2 id="ch${i+1}">Chapter ${i + 1}</h2>
    <h3>${ch.title}</h3>
    ${ch.content.replace(/^#\s+.+$/m, '').replace(/\n/g, '<br>\n')}
  </div>
  `).join('\n')}
</body>
</html>`;
    
    const htmlPath = path.join(OUTPUT_DIR, 'manuscript.html');
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log(`✓ Saved: ${htmlPath}`);
    
    // Update config with chapter info
    config.chapters = chapters.map((ch, index) => ({
      number: index + 1,
      file: ch.file,
      title: ch.title,
      wordCount: ch.wordCount,
      status: 'draft'
    }));
    
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    console.log(`✓ Updated: ${CONFIG_PATH}`);
  } else {
    console.log('\n⚠ No chapters found. Add chapter files to /chapters/ directory.');
  }
  
  console.log('\n✨ Compilation complete!\n');
}

// Run compilation
compileManuscript();
