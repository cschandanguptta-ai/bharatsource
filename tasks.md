# Implementation Tasks: Book-Writing System

## Phase 1: Core Infrastructure

- [x] 1.1 Create Chapter File Template Generator
  - Requirement: Req 12 (Chapter Template System)
  - Create `chapter-template.js` with template generation function
  - Support different template types (core, bonus, reference)
  - Include bilingual section headers
  - Auto-populate template variables (chapter number, title, volume)
  - Validate template structure

- [x] 1.2 Implement Markdown Extraction Engine
  - Requirement: Req 2 (Markdown Extraction Engine)
  - Implement regex pattern matching for LEKHAK_REPOSITORY["key"] = content
  - Implement fallback pattern for .content = markdown
  - Implement last-resort fallback for largest backtick-delimited block
  - Handle escaped backticks within content
  - Extract content from files with multiple template literals
  - Throw descriptive errors when extraction fails
  - Test with sample chapter files

- [x] 1.3 Create Content Repository Manager
  - Requirement: Req 11 (Content Repository Management)
  - Initialize window.LEKHAK_REPOSITORY if not exists
  - Implement registerChapter(key, content) function
  - Implement getChapter(key) function
  - Implement exportRepository() function (JSON export)
  - Implement importRepository(json) function
  - Validate unique chapter keys
  - Support both browser and Node.js environments

## Phase 2: Compilation System

- [x] 2.1 Implement Chapter Manifest Parser
  - Requirement: Req 3 (Volume Compilation System)
  - Create ChapterManifest class with validation
  - Support fields: file, num, title, titleEn, type
  - Validate all files exist before compilation
  - Generate warning for missing chapters
  - Support core and bonus chapter types

- [x] 2.2 Build Volume Compiler
  - Requirement: Req 3 (Volume Compilation System)
  - Implement compileVolume(config) main function
  - Create output directory if not exists
  - Process chapters in manifest order
  - Extract markdown from each chapter
  - Count words for each chapter
  - Generate front matter
  - Generate table of contents
  - Concatenate chapter content
  - Generate back matter
  - Return compilation result with metadata

- [x] 2.3 Implement Front Matter Generator
  - Requirement: Req 6 (Front Matter Generation)
  - Generate title page (title, subtitle, volume, CEFR, author, edition, publisher)
  - Generate copyright page (notice, year, author, edition, language, audience)
  - Generate dedication section (bilingual)
  - Generate preface (purpose, features, usage instructions)
  - Generate table of contents (core/bonus separation, word counts)
  - Support customizable metadata

- [x] 2.4 Implement Back Matter Generator
  - Requirement: Req 3 (Volume Compilation System)
  - Generate afterword (summary, next volume preview)
  - Generate author bio
  - Add final copyright footer

## Phase 3: Rendering Engine

- [x] 3.1 Build Markdown to HTML Converter
  - Requirement: Req 4 (Markdown to HTML Converter)
  - Escape HTML entities (&, <, >)
  - Convert headings (# to h1, ## to h2, etc.)
  - Convert bold and italic
  - Convert inline code
  - Convert blockquotes
  - Convert horizontal rules
  - Convert unordered and ordered lists
  - Convert tables (pipe syntax to table element)
  - Handle nested structures

- [x] 3.2 Implement Print CSS Generator
  - Requirement: Req 5 (Print-Ready CSS Styling)
  - Define A4 page size (210mm x 297mm)
  - Set margins (2.5cm T/B, 2cm R, 2.5cm L with binding gutter)
  - Configure fonts (Noto Serif Devanagari, Source Serif 4, Inter)
  - Set base font size (11pt) and line-height (1.75)
  - Style headings (h1: 22pt, h2: 16pt, h3: 13pt, h4: 11pt)
  - Add page-break-before: always for chapters
  - Style tables, blockquotes, and code elements
  - Add media screen and print queries

- [x] 3.3 Create HTML Output Generator
  - Requirement: Req 3 (Volume Compilation System)
  - Generate full HTML document with all components
  - Embed print CSS
  - Add print toolbar (screen only)
  - Include print instructions

## Phase 4: Quality Assurance

- [x] 4.1 Implement Word Counter
  - Requirement: Req 13 (Word Count Tracking)
  - Split text on whitespace characters
  - Filter empty strings
  - Count words in Devanagari and Latin scripts
  - Return total word count

- [x] 4.2 Build Structure Validator
  - Requirement: Req 14 (Structure Validation)
  - Check for Error Lab sections
  - Check for Practice exercises
  - Check for Hindi-English contrast
  - Check for section headers
  - Validate heading hierarchy
  - Validate table column consistency
  - Generate validation report

- [x] 4.3 Implement Quality Auditor
  - Requirement: Req 7 (Quality Auditing System)
  - Count words per chapter and compare against threshold
  - Check structural elements presence
  - Generate visual progress bar
  - Display summary table (chapter, words, size, gap, status)
  - Verify front matter completeness
  - Support configurable thresholds

## Phase 5: Multi-Volume Support

- [x] 5.1 Create Volume Configuration System
  - Requirement: Req 15 (Compiler Configuration)
  - Create config_vol{N}.json schema
  - Support all metadata, output, quality, and styling fields
  - Load settings from config file with defaults fallback
  - Validate config against JSON schema
  - Support environment variables and command-line overrides

- [x] 5.2 Implement Multi-Volume Manager
  - Requirement: Req 8 (Multi-Volume Project Management)
  - Support multiple compiler scripts per volume
  - Allow independent chapter manifests and metadata per volume
  - Generate separate output files per volume
  - Support shared utility functions across volumes

## Phase 6: Export Formats

- [x] 6.1 Implement Markdown Export
  - Requirement: Req 20 (Export Formats)
  - Concatenate all chapters with front/back matter
  - Write to .md file
  - Support individual chapter and volume export

- [x] 6.2 Implement EPUB Exporter
  - Requirement: Req 20 (Export Formats)
  - Generate valid EPUB 3.0 structure
  - Create metadata.xml, content.opf, toc.ncx
  - Package as EPUB (ZIP with proper structure)

- [x] 6.3 Implement DOCX Exporter
  - Requirement: Req 20 (Export Formats)
  - Generate DOCX with proper structure
  - Preserve formatting, tables, and bilingual content

## Phase 7: Preview and Development Tools

- [ ] 7.1 Create Preview Server
  - Requirement: Req 17 (Preview and Live Reload)
  - Watch chapter files for changes and auto-recompile
  - Serve compiled HTML on local server with auto-refresh
  - Display compilation errors in preview
  - Support preview themes (light, dark, print simulation)

- [ ] 7.2 Implement Search and Navigation
  - Requirement: Req 19 (Search and Navigation)
  - Full-text search across all chapter files
  - Display search results with context
  - Support regex search and find-and-replace
  - Display chapter outline and navigate to sections

## Phase 8: Version Control Integration

- [ ] 8.1 Create Git Integration Utilities
  - Requirement: Req 18 (Version Control Integration)
  - Generate .gitignore file (exclude output directories)
  - Display Git status for chapter files
  - Support viewing diffs between versions
  - Support tagging releases

## Phase 9: Testing and Documentation

- [ ] 9.1 Create Unit Tests
  - Test markdown extraction engine
  - Test word counter
  - Test markdown-to-HTML converter
  - Test front matter and back matter generators
  - Test quality auditor and structure validator

- [ ] 9.2 Create Integration Tests
  - Test full compilation pipeline
  - Test multi-volume compilation
  - Test error handling and edge cases

- [ ] 9.3 Write User Documentation
  - Installation guide
  - Getting started tutorial
  - Chapter file format documentation
  - Configuration guide
  - Compilation workflow and export format documentation
  - Troubleshooting guide
