#!/usr/bin/env node

/**
 * Novel Compiler - Assembles chapters into a complete manuscript
 * Optimized for fiction writing with character consistency checks
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Configuration
const CONFIG_FILE = path.join(__dirname, 'config.json');
const CHAPTERS_DIR = path.join(__dirname, 'chapters');
const OUTPUT_DIR = path.join(__dirname, 'output');

console.log('📚 Novel Compiler v1.0\n');

// Load configuration
if (!fs.existsSync(CONFIG_FILE)) {
    console.error('❌ Error: config.json not found');
    process.exit(1);
}

const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
console.log(`📖 Compiling: "${config.title}" by ${config.author}`);
console.log(`🎭 Genre: ${config.genre}`);
console.log(`📝 Target Word Count: ${config.wordCountTarget.toLocaleString()}\n`);

// Extract chapter content from JavaScript files
function extractChapterContent(filePath) {
    const code = fs.readFileSync(filePath, 'utf8');
    const sandbox = { window: { LEKHAK_REPOSITORY: {} } };
    
    try {
        vm.runInNewContext(code, sandbox);
        const chapterKey = Object.keys(sandbox.window.LEKHAK_REPOSITORY)[0];
        return sandbox.window.LEKHAK_REPOSITORY[chapterKey];
    } catch (error) {
        console.error(`❌ Error parsing ${filePath}: ${error.message}`);
        return null;
    }
}

// Count words in markdown text
function countWords(text) {
    // Remove markdown formatting for accurate count
    const cleaned = text
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/`[^`]+`/g, '') // Remove inline code
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // Remove images
        .replace(/\[[^\]]*\]\([^)]*\)/g, '') // Remove links
        .replace(/[#*_~]/g, '') // Remove formatting chars
        .trim();
    
    return cleaned.split(/\s+/).filter(word => word.length > 0).length;
}

// Compile chapters
const manuscript = [];
let totalWords = 0;
const chapterStats = [];

// Sort chapters by ID
const chapterFiles = fs.readdirSync(CHAPTERS_DIR)
    .filter(f => f.endsWith('.js'))
    .sort();

console.log('📄 Processing chapters...\n');

for (const file of chapterFiles) {
    const filePath = path.join(CHAPTERS_DIR, file);
    console.log(`   Reading: ${file}`);
    
    const content = extractChapterContent(filePath);
    if (!content) continue;
    
    const words = countWords(content);
    totalWords += words;
    
    // Extract chapter title from first line
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : file.replace('.js', '');
    
    chapterStats.push({
        file,
        title,
        words
    });
    
    manuscript.push(content);
}

console.log(`\n✅ Loaded ${chapterStats.length} chapters\n`);

// Generate Table of Contents
function generateTOC(chapters) {
    let toc = '## Table of Contents\n\n';
    chapters.forEach((chapter, index) => {
        const titleMatch = chapter.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : `Chapter ${index + 1}`;
        toc += `${index + 1}. ${title}\n`;
    });
    return toc + '\n---\n\n';
}

// Assemble final manuscript
const finalManuscript = `# ${config.title}
## ${config.subtitle || ''}

### By ${config.author}

---

${generateTOC(manuscript)}${manuscript.join('\n\n')}`;

// Write output files
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const timestamp = new Date().toISOString().split('T')[0];
const baseName = config.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');

// Markdown version
const mdFile = path.join(OUTPUT_DIR, `${baseName}_${timestamp}.md`);
fs.writeFileSync(mdFile, finalManuscript, 'utf8');
console.log(`📄 Written: ${path.basename(mdFile)}`);

// HTML version (basic conversion)
function markdownToHtml(md) {
    return md
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>\n');
}

const htmlContent = `<!DOCTYPE html>
<html lang="${config.language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.title}</title>
    <style>
        body { 
            font-family: 'Georgia', serif; 
            line-height: 1.6; 
            max-width: 800px; 
            margin: 40px auto; 
            padding: 20px;
            background: #f9f9f9;
        }
        h1, h2, h3 { color: #2c3e50; }
        .chapter { margin-bottom: 60px; }
        hr { border: none; border-top: 2px solid #ddd; margin: 40px 0; }
    </style>
</head>
<body>
    ${markdownToHtml(finalManuscript)}
</body>
</html>`;

const htmlFile = path.join(OUTPUT_DIR, `${baseName}_${timestamp}.html`);
fs.writeFileSync(htmlFile, htmlContent, 'utf8');
console.log(`🌐 Written: ${path.basename(htmlFile)}`);

// Print statistics
console.log('\n📊 Compilation Statistics:');
console.log('─'.repeat(50));
chapterStats.forEach(stat => {
    const target = config.chapters.find(c => c.id === stat.file.replace('.js', ''))?.wordCountTarget || 0;
    const percentage = target ? Math.round((stat.words / target) * 100) : 0;
    console.log(`   ${stat.title.padEnd(40)} ${stat.words.toLocaleString().padStart(6)} words ${target ? `(${percentage}% of target)` : ''}`);
});
console.log('─'.repeat(50));
console.log(`   TOTAL: ${totalWords.toLocaleString()} words`);
console.log(`   Progress: ${Math.round((totalWords / config.wordCountTarget) * 100)}% of target (${config.wordCountTarget.toLocaleString()} words)\n`);

// Character mention tracking (basic)
console.log('🔍 Character Consistency Check:');
const fullText = manuscript.join('\n').toLowerCase();
Object.entries(config.characters).forEach(([role, char]) => {
    const mentions = (fullText.match(new RegExp(char.name.toLowerCase(), 'g')) || []).length;
    console.log(`   ${char.name} (${role}): ${mentions} mentions`);
});
console.log('');

console.log('✨ Compilation complete! Happy writing! 🎉\n');
