const fs = require('fs');

try {
  // Read the raw text from the input file
  const text = fs.readFileSync('input.txt', 'utf-8');

  const results = [];
  let idCounter = 1;

  // Match optional number, optional bullet, English text, and (Chinese text)
  const regex = /(?:^|\n)(?:(\d+)\.\s*)?(?:[•]\s*)?([\s\S]*?)\(([^)]*?[\u4e00-\u9fa5]+[^)]*?)\)/g;

  let sentenceMatch;
  while ((sentenceMatch = regex.exec(text)) !== null) {
    let numStr = sentenceMatch[1];
    let english = sentenceMatch[2].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    let chinese = sentenceMatch[3].replace(/\n/g, '').trim();

    if (!english || !chinese) continue;
    
    // Clean up leading bullets or spaces
    english = english.replace(/^[•\s]+/, '').trim();
    if (english.length < 2) continue;

    let id = numStr ? parseInt(numStr, 10) : idCounter;
    idCounter = id + 1;

    let topicId = 'daily';
    if (id >= 86 && id <= 250) topicId = 'workplace';
    else if (id >= 251 && id <= 550) topicId = 'tech';
    else if (id >= 551) topicId = 'slang';

    english = english.replace(/"/g, '\\"');
    chinese = chinese.replace(/"/g, '\\"');

    results.push(`  { id: '${id}', topicId: '${topicId}', english: "${english}", chinese: "${chinese}" }`);
  }

  let tsContent = fs.readFileSync('/src/data/shortSentenceCorpus.ts', 'utf-8');
  tsContent = tsContent.replace(/export const shortSentences: ShortSentence\[\] = \[[\s\S]*?\];/, `export const shortSentences: ShortSentence[] = [\n${results.join(',\n')}\n];`);

  fs.writeFileSync('/src/data/shortSentenceCorpus.ts', tsContent, 'utf-8');
  console.log("Parsed " + results.length + " sentences and updated the corpus.");
} catch (error) {
  console.error("Error:", error);
}
