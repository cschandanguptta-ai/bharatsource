/**
 * Front Matter Generator
 * Generates professional front matter sections for book volumes.
 * Each section is returned as a markdown string starting with a page-break marker (---).
 */

/**
 * Generates the title page section.
 *
 * @param {object} config - VolumeConfig
 * @returns {string} Title page markdown
 */
function generateTitlePage(config) {
  const { bookTitle, bookSubtitle, volume, cefr, author, edition, publisher } = config;

  return [
    '---',
    '',
    '<div style="text-align:center">',
    '',
    `# ${bookTitle}`,
    '',
    `### ${bookSubtitle}`,
    '',
    `**${volume}**`,
    '',
    `*CEFR Level: ${cefr}*`,
    '',
    '&nbsp;',
    '',
    `**${author}**`,
    '',
    `*${edition}*`,
    '',
    `${publisher}`,
    '',
    '</div>',
    '',
  ].join('\n');
}

/**
 * Generates the copyright page section.
 *
 * @param {object} config - VolumeConfig
 * @returns {string} Copyright page markdown
 */
function generateCopyrightPage(config) {
  const { author, year, edition, publisher } = config;

  return [
    '---',
    '',
    '<div style="font-size:small">',
    '',
    `Copyright © ${year} ${author}`,
    '',
    `*${edition}*`,
    '',
    `Published by ${publisher}`,
    '',
    'Language: English (with Hindi explanations)',
    '',
    'Target Audience: Hindi-speaking learners of English',
    '',
    'ISBN: [Pending]',
    '',
    'All rights reserved. No part of this publication may be reproduced, distributed,',
    'or transmitted in any form or by any means without the prior written permission',
    'of the publisher.',
    '',
    '</div>',
    '',
  ].join('\n');
}

/**
 * Generates the dedication section (bilingual Hindi + English).
 *
 * @param {object} config - VolumeConfig
 * @returns {string} Dedication markdown
 */
function generateDedication(config) {
  const { author } = config;

  return [
    '---',
    '',
    '## समर्पण / Dedication',
    '',
    '*उन सभी हिंदी-भाषी शिक्षार्थियों को,*',
    '*जो अंग्रेज़ी सीखने का सपना देखते हैं।*',
    '',
    '*To all Hindi-speaking learners*',
    '*who dream of mastering English.*',
    '',
    `— ${author}`,
    '',
  ].join('\n');
}

/**
 * Generates the preface section.
 *
 * @param {object} config - VolumeConfig
 * @returns {string} Preface markdown
 */
function generatePreface(config) {
  const { bookTitle, volume, cefr } = config;

  return [
    '---',
    '',
    '## प्रस्तावना / Preface',
    '',
    `**${bookTitle}** is designed to help Hindi-speaking learners build a strong foundation`,
    `in English. ${volume} covers ${cefr} level content with a focus on practical`,
    'communication skills.',
    '',
    '### Key Features / मुख्य विशेषताएँ',
    '',
    '- **Bilingual explanations** — Concepts explained in both Hindi and English',
    '- **Contrastive linguistics** — Hindi-English comparisons to highlight differences',
    '- **Error Lab** — Common mistakes and how to avoid them',
    '- **Practice exercises** — Reinforcement activities after each concept',
    '- **Word counts** — Each chapter targets 9,000+ words for thorough coverage',
    '',
    '### How to Use This Book / इस पुस्तक का उपयोग कैसे करें',
    '',
    '1. Read each chapter in order for best results.',
    '2. Complete all practice exercises before moving on.',
    '3. Review the Error Lab sections carefully.',
    '4. Use the bilingual glossary for quick reference.',
    '5. Revisit chapters as needed for reinforcement.',
    '',
  ].join('\n');
}

/**
 * Generates the table of contents section.
 *
 * @param {object} config - VolumeConfig
 * @param {Array}  chapters - Chapter objects with num, title, titleEn, type, words
 * @returns {string} Table of contents markdown
 */
function generateTOC(config, chapters) {
  const { bookTitle, volume } = config;
  const coreChapters = chapters.filter(ch => ch.type === 'core');
  const bonusChapters = chapters.filter(ch => ch.type === 'bonus');
  const totalWords = chapters.reduce((sum, ch) => sum + (ch.words || 0), 0);

  const lines = [
    '---',
    '',
    '## विषय-सूची / Table of Contents',
    '',
    `**${bookTitle} — ${volume}**`,
    '',
    `Total Chapters: ${chapters.length} | Total Words: ${totalWords.toLocaleString()}`,
    '',
  ];

  if (coreChapters.length > 0) {
    lines.push('### Core Chapters / मुख्य अध्याय', '');
    for (const ch of coreChapters) {
      lines.push(`- **Chapter ${ch.num}**: ${ch.title} / ${ch.titleEn} *(${(ch.words || 0).toLocaleString()} words)*`);
    }
    lines.push('');
  }

  if (bonusChapters.length > 0) {
    lines.push('### Bonus Chapters / अतिरिक्त अध्याय', '');
    for (const ch of bonusChapters) {
      lines.push(`- **Bonus ${ch.num}**: ${ch.title} / ${ch.titleEn} *(${(ch.words || 0).toLocaleString()} words)*`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Generates all front matter sections combined.
 *
 * @param {object} config   - VolumeConfig
 * @param {Array}  chapters - Chapter objects with num, title, titleEn, type, words
 * @returns {string} Complete front matter markdown
 */
function generateFrontMatter(config, chapters) {
  return [
    generateTitlePage(config),
    generateCopyrightPage(config),
    generateDedication(config),
    generatePreface(config),
    generateTOC(config, chapters),
  ].join('\n');
}

module.exports = {
  generateFrontMatter,
  generateTitlePage,
  generateCopyrightPage,
  generateDedication,
  generatePreface,
  generateTOC,
};
