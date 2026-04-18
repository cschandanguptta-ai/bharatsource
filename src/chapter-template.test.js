/**
 * Tests for Chapter Template Generator
 */

const {
  generateTemplate,
  generateFilename,
  generateRepositoryKey,
  validateTemplateConfig,
  TEMPLATE_TYPES
} = require('./chapter-template');

// Test 1: Validate template configuration
console.log('Test 1: Validate template configuration');
const validConfig = {
  volume: 1,
  chapterNumber: '1',
  title: 'अंग्रेज़ी वर्णमाला',
  titleEn: 'The English Alphabet',
  type: TEMPLATE_TYPES.CORE,
  topic: 'alphabet',
  targetWords: 10000
};

const validation = validateTemplateConfig(validConfig);
console.log('Valid config:', validation.isValid ? '✅ PASS' : '❌ FAIL');
console.log('Errors:', validation.errors);
console.log('');

// Test 2: Generate filename for core chapter
console.log('Test 2: Generate filename for core chapter');
const coreFilename = generateFilename(validConfig);
console.log('Generated filename:', coreFilename);
console.log('Expected: v1_ch1_alphabet.js');
console.log(coreFilename === 'v1_ch1_alphabet.js' ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test 3: Generate filename for bonus chapter
console.log('Test 3: Generate filename for bonus chapter');
const bonusConfig = {
  volume: 1,
  chapterNumber: '1',
  title: 'Modal Auxiliaries',
  titleEn: 'Modal Auxiliaries',
  type: TEMPLATE_TYPES.BONUS,
  topic: 'modal_concord'
};
const bonusFilename = generateFilename(bonusConfig);
console.log('Generated filename:', bonusFilename);
console.log('Expected: v1_bonus1_modal_concord.js');
console.log(bonusFilename === 'v1_bonus1_modal_concord.js' ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test 4: Generate repository key
console.log('Test 4: Generate repository key');
const coreKey = generateRepositoryKey(validConfig);
const bonusKey = generateRepositoryKey(bonusConfig);
console.log('Core chapter key:', coreKey);
console.log('Expected: v1_c1');
console.log(coreKey === 'v1_c1' ? '✅ PASS' : '❌ FAIL');
console.log('Bonus chapter key:', bonusKey);
console.log('Expected: v1_b1');
console.log(bonusKey === 'v1_b1' ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test 5: Generate complete template
console.log('Test 5: Generate complete template');
const template = generateTemplate(validConfig);
console.log('Generated filename:', template.filename);
console.log('Repository key:', template.repositoryKey);
console.log('Content length:', template.content.length, 'characters');
console.log('Contains LEKHAK_REPOSITORY:', template.content.includes('LEKHAK_REPOSITORY') ? '✅ PASS' : '❌ FAIL');
console.log('Contains metadata comment:', template.content.includes('Volume 1, Chapter 1') ? '✅ PASS' : '❌ FAIL');
console.log('Contains bilingual headers:', template.content.includes('सीखने के उद्देश्य') && template.content.includes('Learning Objectives') ? '✅ PASS' : '❌ FAIL');
console.log('Contains Error Lab:', template.content.includes('त्रुटि प्रयोगशाला') ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test 6: Invalid configuration
console.log('Test 6: Invalid configuration');
const invalidConfig = {
  volume: 'invalid',
  chapterNumber: 1,
  title: '',
  type: 'unknown'
};
const invalidValidation = validateTemplateConfig(invalidConfig);
console.log('Invalid config detected:', !invalidValidation.isValid ? '✅ PASS' : '❌ FAIL');
console.log('Number of errors:', invalidValidation.errors.length);
console.log('');

// Test 7: Generate bonus chapter template
console.log('Test 7: Generate bonus chapter template');
const bonusTemplate = generateTemplate(bonusConfig);
console.log('Bonus template generated:', bonusTemplate.filename);
console.log('Contains bonus sections:', bonusTemplate.content.includes('Concept Explanation') ? '✅ PASS' : '❌ FAIL');
console.log('Does not contain Learning Objectives:', !bonusTemplate.content.includes('Learning Objectives') ? '✅ PASS' : '❌ FAIL');
console.log('');

console.log('=== All Tests Complete ===');
