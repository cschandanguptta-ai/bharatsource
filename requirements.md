# Requirements Document: Book-Writing System

## Introduction

The Book-Writing System is a comprehensive authoring and publishing toolchain for Kiro IDE that enables authors to write, compile, and publish multi-volume book projects. The system replicates and enhances the existing LEKHAK workflow, which stores book chapters as JavaScript files with embedded markdown content, then compiles them into print-ready formats (HTML, PDF, Markdown) suitable for platforms like Amazon KDP.

This system targets technical authors, educators, and content creators who need a structured, version-controlled approach to book authoring with support for bilingual content, professional typography, and automated quality auditing.

## Glossary

- **Book_Writing_System**: The complete feature set for authoring and compiling books in Kiro IDE
- **Chapter_File**: A JavaScript file containing markdown content stored in a template literal
- **Content_Repository**: A JavaScript object (window.LEKHAK_REPOSITORY) that stores all chapter content
- **Compiler**: A Node.js script that extracts markdown from Chapter_Files and generates output formats
- **Manuscript**: The compiled output of all chapters in a volume
- **Volume**: A collection of related chapters forming one book in a multi-volume series
- **Front_Matter**: Title page, copyright, dedication, preface, and table of contents
- **Back_Matter**: Afterword, author bio, and closing content
- **Quality_Auditor**: A tool that validates word counts, structure, and publishing standards
- **Print_CSS**: Cascading Style Sheets optimized for A4 print layout and Amazon KDP requirements
- **Chapter_Manifest**: An ordered list defining which chapters belong to a volume
- **Bilingual_Content**: Content written in two languages (e.g., Hindi Devanagari + English)
- **CEFR_Level**: Common European Framework of Reference for Languages proficiency level
- **IPA**: International Phonetic Alphabet for pronunciation guidance
- **Error_Lab**: A structured section documenting common mistakes and corrections

## Requirements

### Requirement 1: Chapter File Management

**User Story:** As an author, I want to store book chapters as structured JavaScript files with embedded markdown content, so that I can leverage version control and code editor features while writing.

#### Acceptance Criteria

1. THE Book_Writing_System SHALL support creating Chapter_Files in JavaScript format with markdown content stored in template literals
2. WHEN a Chapter_File is created, THE Book_Writing_System SHALL use the pattern `window.LEKHAK_REPOSITORY["key"] = \`markdown content\``
3. THE Book_Writing_System SHALL support organizing Chapter_Files in a dedicated chapters directory
4. THE Book_Writing_System SHALL allow authors to name Chapter_Files using a consistent naming convention (e.g., v1_ch1_topic.js, v2_bonus3_topic.js)
5. WHEN editing a Chapter_File, THE Book_Writing_System SHALL provide syntax highlighting for both JavaScript and embedded markdown
6. THE Book_Writing_System SHALL preserve all markdown formatting including headers, tables, lists, code blocks, and special characters
7. THE Book_Writing_System SHALL support Unicode content for bilingual writing (Devanagari, Latin scripts)
8. WHEN a Chapter_File exceeds 10,000 words, THE Book_Writing_System SHALL display a word count indicator
9. THE Book_Writing_System SHALL validate that Chapter_Files contain properly closed template literals
10. THE Book_Writing_System SHALL support metadata comments at the top of Chapter_Files (volume, chapter number, target word count, pedagogy notes)

### Requirement 2: Markdown Extraction Engine

**User Story:** As an author, I want the system to extract markdown content from JavaScript Chapter_Files reliably, so that I can compile my book without manual content copying.

#### Acceptance Criteria

1. THE Compiler SHALL extract markdown content from template literals in Chapter_Files
2. WHEN a Chapter_File uses the pattern `LEKHAK_REPOSITORY["key"] = \`content\``, THE Compiler SHALL locate the opening backtick after the equals sign
3. THE Compiler SHALL scan backward from the end of the file to find the closing backtick
4. WHEN multiple template literals exist in a file, THE Compiler SHALL extract the largest block exceeding 1000 characters
5. THE Compiler SHALL support alternative patterns including `.content = \`markdown\``
6. THE Compiler SHALL preserve all whitespace, line breaks, and special characters during extraction
7. WHEN extraction fails, THE Compiler SHALL throw a descriptive error message indicating the file and reason
8. THE Compiler SHALL handle escaped backticks within content without treating them as delimiters
9. THE Compiler SHALL extract content from files containing both single-line and multi-line template literals
10. FOR ALL valid Chapter_Files, THE Compiler SHALL extract content in under 100 milliseconds per file

### Requirement 3: Volume Compilation System

**User Story:** As an author, I want to compile multiple chapters into a single volume manuscript, so that I can generate a complete book from individual chapter files.

#### Acceptance Criteria

1. THE Compiler SHALL accept a Chapter_Manifest defining the order and metadata of chapters in a Volume
2. WHEN compiling a Volume, THE Compiler SHALL process chapters in the exact order specified in the Chapter_Manifest
3. THE Compiler SHALL support Chapter_Manifest entries with fields: file, num, title, titleEn, type (core/bonus)
4. THE Compiler SHALL generate three output formats: raw markdown (.md), print-ready HTML (.html), and optionally PDF-ready HTML
5. WHEN a Chapter_File listed in the manifest is missing, THE Compiler SHALL log a warning and continue with available chapters
6. THE Compiler SHALL concatenate all extracted chapter content with appropriate section breaks
7. THE Compiler SHALL generate Front_Matter including title page, copyright notice, dedication, preface, and table of contents
8. THE Compiler SHALL generate Back_Matter including afterword and author biography
9. THE Compiler SHALL calculate total word count across all chapters in the Volume
10. THE Compiler SHALL create an output directory if it does not exist
11. THE Compiler SHALL support compiling multiple volumes independently (compile_vol1.js, compile_vol2.js, etc.)
12. WHEN compilation completes, THE Compiler SHALL display a summary showing file paths, sizes, and word counts

### Requirement 4: Markdown to HTML Converter

**User Story:** As an author, I want my markdown content converted to professionally formatted HTML, so that I can generate print-ready PDFs for publishing.

#### Acceptance Criteria

1. THE Compiler SHALL convert markdown headings (# ## ### ####) to HTML heading tags (h1 h2 h3 h4)
2. THE Compiler SHALL convert markdown bold (**text**) and italic (*text*) to HTML strong and em tags
3. THE Compiler SHALL convert markdown tables with pipe syntax to HTML table elements
4. THE Compiler SHALL convert markdown lists (ordered and unordered) to HTML ul/ol/li elements
5. THE Compiler SHALL convert markdown blockquotes (> text) to HTML blockquote elements
6. THE Compiler SHALL convert inline code (`code`) to HTML code elements
7. THE Compiler SHALL convert horizontal rules (---) to HTML hr elements
8. THE Compiler SHALL escape HTML special characters (&, <, >) in markdown content
9. THE Compiler SHALL wrap consecutive list items in appropriate ul or ol containers
10. THE Compiler SHALL preserve paragraph breaks by converting double newlines to p tags
11. WHEN converting tables, THE Compiler SHALL distinguish between header rows and body rows
12. THE Compiler SHALL handle nested markdown structures (bold within lists, code within tables)

### Requirement 5: Print-Ready CSS Styling

**User Story:** As an author, I want my HTML output styled for A4 print layout with professional typography, so that I can generate PDFs suitable for Amazon KDP publishing.

#### Acceptance Criteria

1. THE Compiler SHALL generate Print_CSS with A4 page size (210mm × 297mm)
2. THE Print_CSS SHALL define margins of 2.5cm top/bottom, 2cm right, 2.5cm left (with binding gutter)
3. THE Print_CSS SHALL use web fonts suitable for bilingual content (Noto Serif Devanagari, Source Serif 4)
4. THE Print_CSS SHALL set base font size to 11pt with line-height of 1.75 for readability
5. THE Print_CSS SHALL apply page-break-before: always to chapter divisions
6. THE Print_CSS SHALL style tables with borders, alternating row colors, and page-break-inside: avoid
7. THE Print_CSS SHALL style blockquotes with background color, left border, and italic text
8. THE Print_CSS SHALL style code elements with monospace font and background color
9. THE Print_CSS SHALL apply different heading sizes and colors for visual hierarchy (h1: 22pt, h2: 16pt, h3: 13pt, h4: 11pt)
10. WHEN viewed on screen, THE Print_CSS SHALL display content in a centered container with shadow for preview
11. WHEN printed, THE Print_CSS SHALL hide screen-only elements (print toolbar, navigation)
12. THE Print_CSS SHALL justify paragraph text with appropriate word spacing

### Requirement 6: Front Matter Generation

**User Story:** As an author, I want the system to automatically generate professional front matter, so that my book includes all necessary publishing elements.

#### Acceptance Criteria

1. THE Compiler SHALL generate a title page with book title, subtitle, volume designation, CEFR level, author name, edition, and publisher
2. THE Compiler SHALL generate a copyright page with copyright notice, publication year, author name, edition, language, and target audience
3. THE Compiler SHALL generate a table of contents listing all chapters with titles (bilingual), word counts, and page references
4. THE Compiler SHALL generate a preface explaining the book's purpose, features, and usage instructions
5. THE Compiler SHALL generate a dedication section
6. WHEN generating the table of contents, THE Compiler SHALL separate core chapters from bonus chapters
7. THE Compiler SHALL calculate and display total word count and chapter count in the table of contents
8. THE Compiler SHALL format the title page with centered text and appropriate spacing for visual appeal
9. THE Compiler SHALL position the copyright page on a separate page with small font size
10. THE Compiler SHALL support customizable metadata (author name, book title, volume number, CEFR level, edition, year, publisher)

### Requirement 7: Quality Auditing System

**User Story:** As an author, I want automated quality checks on my manuscript, so that I can ensure each chapter meets publishing standards before compilation.

#### Acceptance Criteria

1. THE Quality_Auditor SHALL count words in each chapter and compare against target thresholds
2. WHEN a chapter falls below 9000 words, THE Quality_Auditor SHALL display a warning indicator
3. THE Quality_Auditor SHALL check for presence of required structural elements (Error Lab, Practice exercises, Hindi-English contrast, Section headers)
4. THE Quality_Auditor SHALL generate a visual progress bar showing each chapter's word count as a percentage of target
5. THE Quality_Auditor SHALL calculate total word count across all chapters
6. THE Quality_Auditor SHALL calculate file sizes for each Chapter_File
7. THE Quality_Auditor SHALL display a summary table with chapter number, word count, file size, gap from target, and pass/fail status
8. WHEN all chapters meet minimum thresholds, THE Quality_Auditor SHALL display a success message
9. WHEN some chapters are below threshold, THE Quality_Auditor SHALL display counts of PASS, NEAR, and LOW status chapters
10. THE Quality_Auditor SHALL verify front matter completeness (title page, copyright, TOC, preface, dedication)
11. THE Quality_Auditor SHALL verify print formatting settings (page size, margins, typography, chapter breaks)
12. THE Quality_Auditor SHALL support configurable thresholds (pass threshold, warning threshold, target word count)

### Requirement 8: Multi-Volume Project Management

**User Story:** As an author, I want to manage multiple book volumes in a single project, so that I can organize a multi-volume series with shared infrastructure.

#### Acceptance Criteria

1. THE Book_Writing_System SHALL support multiple Compiler scripts (compile_vol1.js, compile_vol2.js, etc.) in the same project
2. THE Book_Writing_System SHALL allow each Volume to have independent Chapter_Manifests
3. THE Book_Writing_System SHALL allow each Volume to have independent metadata (title, subtitle, CEFR level, volume designation)
4. THE Book_Writing_System SHALL store all Chapter_Files in a shared chapters directory
5. THE Book_Writing_System SHALL use naming conventions to distinguish chapters by volume (v1_ch1, v2_ch1, etc.)
6. THE Book_Writing_System SHALL generate separate output files for each Volume (manuscript_v1.md, manuscript_v2.html, etc.)
7. WHEN compiling one Volume, THE Book_Writing_System SHALL not affect other volumes' output files
8. THE Book_Writing_System SHALL support shared utility functions across volume compilers (markdown extraction, word counting, HTML conversion)
9. THE Book_Writing_System SHALL allow volumes to reference different CEFR levels (A1-A2 for Volume 1, A2-B1 for Volume 2)
10. THE Book_Writing_System SHALL support bonus chapters specific to each volume

### Requirement 9: Bilingual Content Support

**User Story:** As an author writing bilingual educational content, I want full support for multiple scripts and languages, so that I can create books with Hindi Devanagari and English text.

#### Acceptance Criteria

1. THE Book_Writing_System SHALL support Unicode UTF-8 encoding for all Chapter_Files and output formats
2. THE Book_Writing_System SHALL render Devanagari script correctly in HTML output using appropriate web fonts
3. THE Book_Writing_System SHALL support bilingual chapter titles (Hindi title + English title)
4. THE Book_Writing_System SHALL support bilingual section headers within chapters
5. THE Book_Writing_System SHALL support IPA (International Phonetic Alphabet) symbols for pronunciation guides
6. THE Book_Writing_System SHALL preserve right-to-left and left-to-right text directionality
7. THE Book_Writing_System SHALL support special characters and diacritics used in linguistic content (ə, ː, ɪ, etc.)
8. WHEN generating PDFs, THE Book_Writing_System SHALL ensure Devanagari fonts are embedded
9. THE Book_Writing_System SHALL support mixed-script tables (Devanagari in one column, Latin in another)
10. THE Book_Writing_System SHALL count words accurately across both scripts

### Requirement 10: PDF Export Workflow

**User Story:** As an author, I want to generate print-ready PDF files from my compiled HTML, so that I can upload directly to Amazon KDP or other publishing platforms.

#### Acceptance Criteria

1. THE Book_Writing_System SHALL generate HTML files optimized for PDF conversion via browser print functionality
2. THE Book_Writing_System SHALL include a print toolbar in HTML output with a "Print / Save PDF" button
3. WHEN the print button is clicked, THE Book_Writing_System SHALL trigger the browser's print dialog
4. THE Book_Writing_System SHALL provide instructions for PDF generation (Ctrl+P, Save as PDF, A4 paper size, no margins)
5. THE Book_Writing_System SHALL ensure Print_CSS is applied during PDF generation
6. THE Book_Writing_System SHALL hide screen-only elements (toolbar, navigation) in PDF output
7. THE Book_Writing_System SHALL ensure page breaks occur at chapter boundaries
8. THE Book_Writing_System SHALL ensure tables and blockquotes do not break across pages
9. THE Book_Writing_System SHALL support A4 page size (210mm × 297mm) as the default
10. THE Book_Writing_System SHALL generate PDFs with embedded fonts for Devanagari and Latin scripts
11. WHEN generating PDFs, THE Book_Writing_System SHALL preserve all formatting, colors, and typography
12. THE Book_Writing_System SHALL support alternative PDF generation methods (headless Chrome, Puppeteer) as optional advanced features

### Requirement 11: Content Repository Management

**User Story:** As an author, I want a centralized content repository that stores all chapter content, so that I can reference and reuse chapters across different compilation contexts.

#### Acceptance Criteria

1. THE Book_Writing_System SHALL support a Content_Repository pattern using a global object (window.LEKHAK_REPOSITORY)
2. THE Content_Repository SHALL store chapter content indexed by unique keys (e.g., "v1_c1", "v2_c13")
3. THE Book_Writing_System SHALL initialize the Content_Repository if it does not exist
4. THE Book_Writing_System SHALL support both browser and Node.js environments for the Content_Repository
5. WHEN a Chapter_File is loaded, THE Book_Writing_System SHALL register its content in the Content_Repository
6. THE Book_Writing_System SHALL allow querying the Content_Repository by chapter key
7. THE Book_Writing_System SHALL support exporting the entire Content_Repository as JSON
8. THE Book_Writing_System SHALL support importing a Content_Repository from JSON
9. THE Book_Writing_System SHALL validate that chapter keys are unique within the repository
10. WHEN a duplicate key is detected, THE Book_Writing_System SHALL log a warning and use the last registered content

### Requirement 12: Chapter Template System

**User Story:** As an author, I want predefined chapter templates, so that I can maintain consistent structure across all chapters.

#### Acceptance Criteria

1. THE Book_Writing_System SHALL provide chapter templates for different content types (core chapter, bonus chapter, reference chapter)
2. THE Book_Writing_System SHALL include template sections: Learning Objectives, Concept Explanation, Examples, Error Lab, Practice Exercises, Summary
3. THE Book_Writing_System SHALL support bilingual section headers in templates
4. THE Book_Writing_System SHALL include placeholder text and formatting examples in templates
5. WHEN creating a new chapter, THE Book_Writing_System SHALL offer template selection
6. THE Book_Writing_System SHALL support custom templates defined by the author
7. THE Book_Writing_System SHALL validate that chapters follow the expected template structure
8. THE Book_Writing_System SHALL support template variables (chapter number, title, volume, target word count)
9. THE Book_Writing_System SHALL auto-populate template variables when creating a new chapter
10. THE Book_Writing_System SHALL support markdown formatting guides within templates (table syntax, blockquote syntax, etc.)

### Requirement 13: Word Count Tracking

**User Story:** As an author, I want real-time word count tracking for chapters, so that I can monitor progress toward target word counts.

#### Acceptance Criteria

1. THE Book_Writing_System SHALL count words in markdown content by splitting on whitespace
2. THE Book_Writing_System SHALL exclude markdown syntax characters from word counts (# * _ ` | -)
3. THE Book_Writing_System SHALL count words in both Devanagari and Latin scripts
4. THE Book_Writing_System SHALL display current word count for the active Chapter_File
5. THE Book_Writing_System SHALL display target word count and remaining words for the active chapter
6. THE Book_Writing_System SHALL update word count in real-time as the author types
7. THE Book_Writing_System SHALL display a progress bar showing percentage of target word count achieved
8. WHEN a chapter reaches target word count, THE Book_Writing_System SHALL display a success indicator
9. THE Book_Writing_System SHALL support configurable target word counts per chapter
10. THE Book_Writing_System SHALL calculate average words per chapter across a volume
11. THE Book_Writing_System SHALL display total word count for a volume
12. THE Book_Writing_System SHALL support exporting word count reports as CSV or JSON

### Requirement 14: Structure Validation

**User Story:** As an author, I want automated validation of chapter structure, so that I can ensure all required sections are present before compilation.

#### Acceptance Criteria

1. THE Book_Writing_System SHALL validate that chapters contain required sections (Learning Objectives, Concept Explanation, Examples, Practice Exercises)
2. THE Book_Writing_System SHALL check for presence of Error Lab sections in educational content
3. THE Book_Writing_System SHALL validate that chapters contain bilingual headers where required
4. THE Book_Writing_System SHALL check for presence of summary sections at chapter end
5. WHEN a required section is missing, THE Book_Writing_System SHALL display a warning with the section name
6. THE Book_Writing_System SHALL validate markdown syntax (unclosed code blocks, malformed tables, broken links)
7. THE Book_Writing_System SHALL check for consistent heading hierarchy (no h3 before h2)
8. THE Book_Writing_System SHALL validate that tables have consistent column counts
9. THE Book_Writing_System SHALL check for orphaned list items (list items without parent ul/ol)
10. THE Book_Writing_System SHALL support custom validation rules defined by the author
11. THE Book_Writing_System SHALL generate a validation report listing all issues found
12. WHEN validation passes, THE Book_Writing_System SHALL display a success message

### Requirement 15: Compiler Configuration

**User Story:** As an author, I want to configure compiler settings for each volume, so that I can customize output formats and metadata without modifying code.

#### Acceptance Criteria

1. THE Book_Writing_System SHALL support configuration files for each volume (config_vol1.json, config_vol2.json)
2. THE configuration file SHALL include fields: author, bookTitle, bookSubtitle, volume, edition, publisher, CEFR, year
3. THE configuration file SHALL include output settings: formats (md, html, pdf), outputDir, fileNames
4. THE configuration file SHALL include quality settings: targetWordCount, passThreshold, warnThreshold
5. THE configuration file SHALL include styling settings: pageSize, margins, fonts, colors
6. WHEN a configuration file is present, THE Compiler SHALL load settings from it
7. WHEN a configuration file is missing, THE Compiler SHALL use default settings
8. THE Book_Writing_System SHALL validate configuration files against a JSON schema
9. WHEN configuration is invalid, THE Compiler SHALL display descriptive error messages
10. THE Book_Writing_System SHALL support environment variables for sensitive settings (API keys, credentials)
11. THE Book_Writing_System SHALL allow command-line arguments to override configuration settings
12. THE Book_Writing_System SHALL support configuration inheritance (volume config extends base config)

### Requirement 16: Error Handling and Logging

**User Story:** As an author, I want clear error messages and detailed logs, so that I can troubleshoot compilation issues quickly.

#### Acceptance Criteria

1. WHEN a Chapter_File cannot be read, THE Compiler SHALL log the file path and error reason
2. WHEN markdown extraction fails, THE Compiler SHALL log the file name and extraction pattern attempted
3. WHEN a chapter is missing from the manifest, THE Compiler SHALL log a warning and continue compilation
4. WHEN HTML conversion encounters invalid markdown, THE Compiler SHALL log the line number and content
5. WHEN output directory creation fails, THE Compiler SHALL log the directory path and permission error
6. THE Compiler SHALL display a progress indicator showing current chapter being processed
7. THE Compiler SHALL log compilation start time, end time, and total duration
8. THE Compiler SHALL log memory usage statistics for large compilations
9. WHEN compilation succeeds, THE Compiler SHALL display a success summary with output file paths
10. WHEN compilation fails, THE Compiler SHALL display an error summary with actionable next steps
11. THE Book_Writing_System SHALL support log levels (debug, info, warn, error)
12. THE Book_Writing_System SHALL support writing logs to a file for later review

### Requirement 17: Preview and Live Reload

**User Story:** As an author, I want to preview my compiled book in real-time as I write, so that I can see how changes affect the final output.

#### Acceptance Criteria

1. THE Book_Writing_System SHALL provide a preview mode that watches Chapter_Files for changes
2. WHEN a Chapter_File is saved, THE Book_Writing_System SHALL automatically recompile the affected volume
3. THE Book_Writing_System SHALL serve the compiled HTML on a local web server
4. WHEN HTML is regenerated, THE Book_Writing_System SHALL automatically refresh the browser preview
5. THE preview server SHALL support hot module replacement for instant updates
6. THE Book_Writing_System SHALL display compilation errors in the browser preview
7. THE Book_Writing_System SHALL support side-by-side preview (markdown source on left, rendered output on right)
8. THE Book_Writing_System SHALL highlight the current chapter being edited in the preview
9. THE Book_Writing_System SHALL support scrolling synchronization between source and preview
10. THE Book_Writing_System SHALL support preview themes (light mode, dark mode, print simulation)
11. WHEN preview mode is active, THE Book_Writing_System SHALL display a status indicator
12. THE Book_Writing_System SHALL support keyboard shortcuts for preview navigation (next chapter, previous chapter, toggle preview)

### Requirement 18: Version Control Integration

**User Story:** As an author, I want seamless version control integration, so that I can track changes to my book over time and collaborate with editors.

#### Acceptance Criteria

1. THE Book_Writing_System SHALL store all Chapter_Files as plain text JavaScript files suitable for Git
2. THE Book_Writing_System SHALL generate a .gitignore file excluding output directories and temporary files
3. THE Book_Writing_System SHALL support commit messages that reference chapter numbers and changes
4. THE Book_Writing_System SHALL display Git status for Chapter_Files (modified, staged, committed)
5. THE Book_Writing_System SHALL support viewing diffs between chapter versions
6. THE Book_Writing_System SHALL support branching for experimental chapter rewrites
7. THE Book_Writing_System SHALL support merging changes from multiple authors or editors
8. WHEN merge conflicts occur in Chapter_Files, THE Book_Writing_System SHALL highlight conflicting sections
9. THE Book_Writing_System SHALL support tagging releases (v1.0, v2.0) for published versions
10. THE Book_Writing_System SHALL generate release notes from commit history
11. THE Book_Writing_System SHALL support GitHub/GitLab integration for remote collaboration
12. THE Book_Writing_System SHALL support pull request workflows for editorial review

### Requirement 19: Search and Navigation

**User Story:** As an author, I want powerful search and navigation tools, so that I can quickly find and edit content across multiple chapters and volumes.

#### Acceptance Criteria

1. THE Book_Writing_System SHALL support full-text search across all Chapter_Files
2. THE Book_Writing_System SHALL support searching by chapter title, section header, or content
3. THE Book_Writing_System SHALL display search results with context (surrounding text)
4. THE Book_Writing_System SHALL support filtering search results by volume, chapter type (core/bonus), or word count
5. THE Book_Writing_System SHALL support regular expression search for advanced queries
6. THE Book_Writing_System SHALL support find-and-replace across multiple chapters
7. THE Book_Writing_System SHALL display a chapter outline showing all section headers
8. WHEN a section header is clicked in the outline, THE Book_Writing_System SHALL navigate to that section
9. THE Book_Writing_System SHALL support bookmarking frequently edited chapters
10. THE Book_Writing_System SHALL support recent files list showing last edited chapters
11. THE Book_Writing_System SHALL support keyboard shortcuts for navigation (go to chapter, go to line, go to section)
12. THE Book_Writing_System SHALL support breadcrumb navigation showing current volume > chapter > section

### Requirement 20: Export Formats

**User Story:** As an author, I want to export my book in multiple formats, so that I can publish to different platforms and share with different audiences.

#### Acceptance Criteria

1. THE Book_Writing_System SHALL export manuscripts in markdown (.md) format
2. THE Book_Writing_System SHALL export manuscripts in HTML (.html) format with embedded CSS
3. THE Book_Writing_System SHALL export manuscripts in PDF format via browser print or headless Chrome
4. THE Book_Writing_System SHALL support exporting to EPUB format for e-readers
5. THE Book_Writing_System SHALL support exporting to DOCX format for Microsoft Word
6. THE Book_Writing_System SHALL support exporting to LaTeX format for academic publishing
7. WHEN exporting to EPUB, THE Book_Writing_System SHALL generate a valid EPUB 3.0 file with metadata
8. WHEN exporting to DOCX, THE Book_Writing_System SHALL preserve formatting, tables, and images
9. THE Book_Writing_System SHALL support exporting individual chapters or entire volumes
10. THE Book_Writing_System SHALL support exporting with or without front matter and back matter
11. THE Book_Writing_System SHALL support custom export templates for different publishers
12. THE Book_Writing_System SHALL validate exported files against format specifications


## Summary

This requirements document defines a comprehensive Book-Writing System for Kiro IDE that replicates and enhances the LEKHAK workflow. The system enables authors to:

1. **Author chapters** as JavaScript files with embedded markdown content
2. **Compile volumes** from multiple chapters into professional manuscripts
3. **Generate multiple formats** (Markdown, HTML, PDF) suitable for publishing platforms
4. **Manage multi-volume projects** with independent configurations and shared infrastructure
5. **Support bilingual content** with full Unicode and web font support
6. **Audit quality** with automated word count tracking and structure validation
7. **Preview in real-time** with live reload and side-by-side editing
8. **Export to multiple formats** (EPUB, DOCX, LaTeX) for different publishing needs
9. **Integrate with version control** for collaboration and change tracking
10. **Navigate efficiently** with powerful search and outline tools

The system is designed for technical authors, educators, and content creators who need a structured, version-controlled approach to book authoring with professional typography and automated quality checks.

### Key Differentiators

- **Code-first authoring**: Chapters are JavaScript files, enabling syntax highlighting, version control, and code editor features
- **Bilingual support**: Full support for Devanagari and Latin scripts with appropriate typography
- **Quality-driven**: Automated auditing ensures every chapter meets publishing standards
- **Multi-volume architecture**: Manage entire book series with shared infrastructure
- **Print-ready output**: A4-formatted HTML with professional CSS for direct PDF generation
- **Extensible**: Template system, custom validation rules, and plugin architecture for future enhancements

This system transforms Kiro IDE into a complete book authoring and publishing platform suitable for educational content, technical documentation, and multi-volume book series.
