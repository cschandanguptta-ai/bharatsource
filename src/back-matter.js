/**
 * Back Matter Generator
 * Generates professional back matter sections for book volumes.
 * Each section is returned as a markdown string starting with a page-break marker (---).
 */

/**
 * Generates the afterword section — summary of what was learned and preview of next volume.
 *
 * @param {object} config - VolumeConfig
 * @returns {string} Afterword markdown
 */
function generateAfterword(config) {
  const { bookTitle, volume, cefr } = config;

  return [
    '---',
    '',
    '## उपसंहार / Afterword',
    '',
    `Congratulations on completing **${bookTitle} — ${volume}**!`,
    '',
    `In this volume, you have worked through ${cefr} level English with a focus on`,
    'building practical communication skills. You have explored grammar structures,',
    'vocabulary, pronunciation, and real-world usage — all explained through the lens',
    'of Hindi to make the learning journey as natural as possible.',
    '',
    '### What You Have Learned / आपने क्या सीखा',
    '',
    '- Core grammar structures at this level',
    '- Vocabulary in context with bilingual explanations',
    '- Common errors and how to avoid them (Error Lab)',
    '- Practical exercises to reinforce every concept',
    '',
    '### What Comes Next / आगे क्या है',
    '',
    'The next volume builds on this foundation and takes you to the next CEFR level.',
    'You will encounter more complex sentence structures, richer vocabulary, and',
    'deeper contrastive analysis between Hindi and English.',
    '',
    '*Keep practising. Consistency is the key to fluency.*',
    '',
  ].join('\n');
}

/**
 * Generates the author bio section.
 *
 * @param {object} config - VolumeConfig
 * @returns {string} Author bio markdown
 */
function generateAuthorBio(config) {
  const { author, publisher } = config;

  return [
    '---',
    '',
    '## लेखक के बारे में / About the Author',
    '',
    `**${author}** is an educator and author dedicated to making English accessible`,
    'to Hindi-speaking learners. Drawing on years of teaching experience and a deep',
    'understanding of contrastive linguistics, the author bridges the gap between',
    'Hindi and English in a way that feels intuitive and practical.',
    '',
    `Published by **${publisher}**, this series reflects a commitment to quality`,
    'bilingual education that respects the learner\'s mother tongue while building',
    'confident English communication skills.',
    '',
  ].join('\n');
}

/**
 * Generates the final copyright footer section.
 *
 * @param {object} config - VolumeConfig
 * @returns {string} Copyright footer markdown
 */
function generateCopyrightFooter(config) {
  const { author, year, publisher } = config;

  return [
    '---',
    '',
    '<div style="text-align:center; font-size:small">',
    '',
    `Copyright © ${year} ${author}. All rights reserved.`,
    '',
    `Published by ${publisher}.`,
    '',
    'No part of this book may be reproduced without written permission from the publisher.',
    '',
    '</div>',
    '',
  ].join('\n');
}

/**
 * Generates all back matter sections combined.
 *
 * @param {object} config - VolumeConfig (author, bookTitle, bookSubtitle, volume, edition, publisher, cefr, year)
 * @returns {string} Complete back matter markdown
 */
function generateBackMatter(config) {
  return [
    generateAfterword(config),
    generateAuthorBio(config),
    generateCopyrightFooter(config),
  ].join('\n');
}

module.exports = {
  generateBackMatter,
  generateAfterword,
  generateAuthorBio,
  generateCopyrightFooter,
};
