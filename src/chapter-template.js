/**
 * Chapter Template Generator
 * Generates chapter file templates with bilingual headers and proper structure
 */

/**
 * Template types supported by the system
 */
const TEMPLATE_TYPES = {
  CORE: 'core',
  BONUS: 'bonus',
  REFERENCE: 'reference'
};

/**
 * Bilingual section headers for chapter structure
 */
const SECTION_HEADERS = {
  learningObjectives: {
    hindi: '# सीखने के उद्देश्य',
    english: '## Learning Objectives'
  },
  conceptExplanation: {
    hindi: '# अवधारणा की व्याख्या',
    english: '## Concept Explanation'
  },
  examples: {
    hindi: '# उदाहरण',
    english: '## Examples'
  },
  errorLab: {
    hindi: '# त्रुटि प्रयोगशाला',
    english: '## Error Lab'
  },
  practiceExercises: {
    hindi: '# अभ्यास',
    english: '## Practice Exercises'
  },
  summary: {
    hindi: '# सारांश',
    english: '## Summary'
  }
};

/**
 * Validates template configuration
 * @param {Object} config - Template configuration
 * @returns {Object} Validation result with isValid flag and errors array
 */
function validateTemplateConfig(config) {
  const errors = [];
  
  if (!config.volume || typeof config.volume !== 'number') {
    errors.push('Volume must be a valid number');
  }
  
  if (!config.chapterNumber || typeof config.chapterNumber !== 'string') {
    errors.push('Chapter number must be a valid string');
  }
  
  if (!config.title || typeof config.title !== 'string') {
    errors.push('Title (Hindi) must be a valid string');
  }
  
  if (!config.titleEn || typeof config.titleEn !== 'string') {
    errors.push('Title (English) must be a valid string');
  }
  
  if (!config.type || !Object.values(TEMPLATE_TYPES).includes(config.type)) {
    errors.push(`Type must be one of: ${Object.values(TEMPLATE_TYPES).join(', ')}`);
  }
  
  if (config.targetWords && typeof config.targetWords !== 'number') {
    errors.push('Target words must be a number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generates a chapter filename based on configuration
 * @param {Object} config - Template configuration
 * @returns {string} Generated filename
 */
function generateFilename(config) {
  const { volume, chapterNumber, type, topic } = config;
  const volumePrefix = `v${volume}`;
  
  if (type === TEMPLATE_TYPES.BONUS) {
    const topicSlug = topic ? `_${topic.toLowerCase().replace(/\s+/g, '_')}` : '';
    return `${volumePrefix}_bonus${chapterNumber}${topicSlug}.js`;
  } else {
    const topicSlug = topic ? `_${topic.toLowerCase().replace(/\s+/g, '_')}` : '';
    return `${volumePrefix}_ch${chapterNumber}${topicSlug}.js`;
  }
}

/**
 * Generates repository key for the chapter
 * @param {Object} config - Template configuration
 * @returns {string} Repository key
 */
function generateRepositoryKey(config) {
  const { volume, chapterNumber, type } = config;
  
  if (type === TEMPLATE_TYPES.BONUS) {
    return `v${volume}_b${chapterNumber}`;
  } else {
    return `v${volume}_c${chapterNumber}`;
  }
}

/**
 * Generates chapter metadata comment
 * @param {Object} config - Template configuration
 * @returns {string} Metadata comment block
 */
function generateMetadata(config) {
  const { volume, chapterNumber, title, targetWords = 10000, pedagogy = 'Contrastive Linguistics, Deep Theory, Examples, Error Lab' } = config;
  
  return `/**
 * Volume ${volume}, Chapter ${chapterNumber}: ${title}
 * TARGET: ${targetWords.toLocaleString()}+ words
 * Pedagogy: ${pedagogy}
 */`;
}

/**
 * Generates bilingual section content
 * @param {string} sectionKey - Key from SECTION_HEADERS
 * @param {string} placeholder - Placeholder text for the section
 * @returns {string} Formatted section with bilingual headers
 */
function generateSection(sectionKey, placeholder) {
  const section = SECTION_HEADERS[sectionKey];
  if (!section) {
    throw new Error(`Unknown section key: ${sectionKey}`);
  }
  
  return `${section.hindi}
${section.english}

${placeholder}

`;
}

/**
 * Generates complete chapter template content
 * @param {Object} config - Template configuration
 * @returns {string} Complete chapter template as markdown
 */
function generateTemplateContent(config) {
  const { title, titleEn, type } = config;
  
  let content = `# ${title}
## ${titleEn}

`;

  // Add sections based on template type
  if (type === TEMPLATE_TYPES.CORE) {
    content += generateSection('learningObjectives', 
      '- Objective 1\n- Objective 2\n- Objective 3');
    
    content += generateSection('conceptExplanation', 
      'Explain the core concept here with detailed theory and examples.');
    
    content += generateSection('examples', 
      '### Example 1\n\nProvide detailed examples with Hindi and English contrast.\n\n### Example 2\n\nMore examples here.');
    
    content += generateSection('errorLab', 
      '| ❌ Incorrect | ✅ Correct | Explanation |\n|-------------|-----------|-------------|\n| Example error | Corrected version | Why this is wrong |');
    
    content += generateSection('practiceExercises', 
      '1. Exercise 1\n2. Exercise 2\n3. Exercise 3');
    
    content += generateSection('summary', 
      'Summarize the key points learned in this chapter.');
    
  } else if (type === TEMPLATE_TYPES.BONUS) {
    content += generateSection('conceptExplanation', 
      'Explain the bonus topic here.');
    
    content += generateSection('examples', 
      '### Example 1\n\nProvide examples.');
    
    content += generateSection('practiceExercises', 
      '1. Exercise 1\n2. Exercise 2');
    
  } else if (type === TEMPLATE_TYPES.REFERENCE) {
    content += '## Reference Material\n\nProvide reference content here.\n\n';
  }
  
  return content;
}

/**
 * Generates a complete chapter file with JavaScript wrapper
 * @param {Object} config - Template configuration
 * @param {Object} options - Additional options
 * @returns {string} Complete chapter file content
 */
function generateChapterFile(config, options = {}) {
  // Validate configuration
  const validation = validateTemplateConfig(config);
  if (!validation.isValid) {
    throw new Error(`Invalid template configuration:\n${validation.errors.join('\n')}`);
  }
  
  const repositoryKey = generateRepositoryKey(config);
  const metadata = generateMetadata(config);
  const templateContent = generateTemplateContent(config);
  
  const includeInitializer = options.includeInitializer !== false;
  
  let fileContent = '';
  
  // Add repository initializer
  if (includeInitializer) {
    fileContent += `if (typeof window !== 'undefined') {
  window.LEKHAK_REPOSITORY = window.LEKHAK_REPOSITORY || {};
}

`;
  }
  
  // Add metadata comment
  fileContent += `${metadata}

`;
  
  // Add content assignment
  fileContent += `window.LEKHAK_REPOSITORY["${repositoryKey}"] = \`
${templateContent}\`;
`;
  
  return fileContent;
}

/**
 * Main template generator function
 * @param {Object} config - Template configuration
 * @param {number} config.volume - Volume number
 * @param {string} config.chapterNumber - Chapter number (e.g., "1", "2", "B1")
 * @param {string} config.title - Chapter title in Hindi
 * @param {string} config.titleEn - Chapter title in English
 * @param {string} config.type - Template type (core, bonus, reference)
 * @param {string} [config.topic] - Optional topic slug for filename
 * @param {number} [config.targetWords=10000] - Target word count
 * @param {string} [config.pedagogy] - Pedagogy description
 * @param {Object} [options] - Additional options
 * @returns {Object} Generated template with filename and content
 */
function generateTemplate(config, options = {}) {
  const filename = generateFilename(config);
  const content = generateChapterFile(config, options);
  
  return {
    filename,
    content,
    repositoryKey: generateRepositoryKey(config)
  };
}

// Export functions
module.exports = {
  generateTemplate,
  generateChapterFile,
  generateFilename,
  generateRepositoryKey,
  validateTemplateConfig,
  TEMPLATE_TYPES,
  SECTION_HEADERS
};
