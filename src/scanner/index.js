export const DIAGNOSTIC_CATEGORIES = [
  {
    id: 'thesis',
    title: 'Core Thesis',
    question: 'What is the central argument or main point of the text?',
    tags: ['Core'],
    patterns: [/argues that/i, /thesis is/i, /this paper/i, /proposes/i, /demonstrates/i, /aims to/i, /objective is/i, /focuses on/i, /shows that/i]
  },
  {
    id: 'claims',
    title: 'Key Claims',
    question: 'What are the main supporting claims or assertions?',
    tags: ['Analysis'],
    patterns: [/asserts/i, /claims/i, /suggests/i, /furthermore/i, /moreover/i, /additionally/i, /evidence shows/i, /indicates/i, /findings/i]
  },
  {
    id: 'rhetoric',
    title: 'Rhetoric & Framing',
    question: 'How is the argument framed or styled rhetorically?',
    tags: ['Rhetoric'],
    patterns: [/paradigm/i, /framework/i, /discourse/i, /narrative/i, /perspective/i, /lens/i, /traditional view/i, /reconceptualize/i, /rethink/i]
  },
  {
    id: 'tone',
    title: 'Tone & Stance',
    question: 'What is the tone or intellectual stance of the author?',
    tags: ['Tone'],
    patterns: [/critical of/i, /challenges/i, /questions/i, /supports/i, /defends/i, /polemical/i, /objective/i, /nuanced/i, /provocative/i, /dismissive/i]
  },
  {
    id: 'implications',
    title: 'Implications',
    question: 'What are the broader consequences or conclusions of this work?',
    tags: ['Impact'],
    patterns: [/implications/i, /concludes/i, /therefore/i, /thus/i, /consequently/i, /results in/i, /leads to/i, /impact on/i, /significance/i]
  }
];

export const scanText = (text) => {
  if (!text) return {};

  const results = {};

  // Clean text and split roughly into sentences
  const cleanText = text.replace(/\\n/g, ' ').replace(/\\r/g, '');
  const sentences = cleanText.split(/(?<=[.!?])\s+/);

  DIAGNOSTIC_CATEGORIES.forEach(category => {
    const matches = [];

    sentences.forEach(sentence => {
      // Find matching patterns in sentence
      const matchedPattern = category.patterns.some(pattern => pattern.test(sentence));

      if (matchedPattern && sentence.length > 20 && sentence.length < 500) {
        if (!matches.includes(sentence.trim())) {
           matches.push(sentence.trim());
        }
      }
    });

    if (matches.length > 0) {
      // Return top 4 matches for more context
      results[category.id] = matches.slice(0, 4);
    }
  });

  // If no specific thesis is found using keywords, grab the first sentence as a fallback for 'thesis'
  // and the last sentence as a fallback for 'implications' if it makes sense.
  if (!results['thesis'] && sentences.length > 0) {
      const firstSentence = sentences[0].trim();
      if(firstSentence.length > 20) {
          results['thesis'] = [firstSentence];
      }
  }

  return results;
};
