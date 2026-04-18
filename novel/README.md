# 🖋️ Novel Writing System

A specialized book-writing system optimized for fiction novels, built on the LEKHAK framework.

## 📁 Project Structure

```
novel/
├── config.json          # Novel metadata, characters, world-building
├── chapters/            # Chapter files (JavaScript with embedded markdown)
│   └── ch01.js
├── output/              # Compiled manuscripts (MD & HTML)
├── assets/              # Images, maps, character sketches
├── compile.js           # Compilation script
└── README.md            # This file
```

## 🚀 Quick Start

### 1. Define Your Novel
Edit `config.json` to set:
- Title, author, genre
- Target word count
- Chapter outline with key events
- Character profiles
- World-building details
- Themes and tone

### 2. Write Chapters
Create chapter files in `chapters/` directory:

```javascript
// chapters/ch01.js
window.LEKHAK_REPOSITORY["ch01"] = `
# Chapter 1: Your Title

Your story begins here...
`;
```

### 3. Compile
```bash
node compile.js
```

This generates:
- Markdown manuscript (`output/*.md`)
- HTML version for preview (`output/*.html`)
- Word count statistics
- Character mention tracking

## ✨ Features

### Fiction-Optimized
- **Character Tracking**: Automatically counts character mentions
- **Chapter Metadata**: POV, setting, key events per chapter
- **Word Count Targets**: Track progress toward your goal
- **Genre Templates**: Pre-configured for sci-fi, fantasy, mystery, etc.

### Version Control Ready
Each chapter is a separate file, making it easy to:
- Track changes with Git
- Revert specific chapters
- Collaborate with editors
- Manage multiple drafts

### Export Formats
- **Markdown**: For editing and version control
- **HTML**: For preview and sharing
- **Ready for conversion**: EPUB, PDF, DOCX (using existing tools)

## 📊 Current Novel: "The Last Algorithm"

**Status**: In Progress (2% complete)
- **Genre**: Cyberpunk Mystery
- **Target**: 60,000 words
- **Chapters Written**: 1 of ~20
- **Current Word Count**: 919 words

### Characters
- **Aria Sharma**: Quantum Code Analyst (Protagonist)
- **Director Vance**: Head of Cyber Security (Antagonist)
- **Kai**: Underground Hacker (Ally)

### Setting
Neo-Mumbai, 2084 - A world of neural interfaces, quantum computing, and digital surveillance.

## 🛠️ Workflow

1. **Plan**: Update config.json with chapter outlines
2. **Draft**: Write chapters in `/chapters`
3. **Compile**: Run `node compile.js`
4. **Review**: Check output files and statistics
5. **Revise**: Edit chapters as needed
6. **Repeat**: Until your novel is complete!

## 💡 Tips for Novel Writing

- **Consistency**: Use the character tracker to ensure main characters appear regularly
- **Pacing**: Monitor word counts per chapter for balanced pacing
- **Versioning**: Commit after each writing session
- **Backup**: The `assets/` folder is perfect for reference materials

---

**Happy Writing! 🎉**
