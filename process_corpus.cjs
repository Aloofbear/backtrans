const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2] || 'input.txt';
const outputPath = process.argv[3] || path.join('src', 'data', 'shortSentenceCorpus.ts');

function parseSentences(text) {
  const results = [];
  let idCounter = 1;
  const regex = /(?:^|\n)(?:(\d+)\.\s*)?(?:[\u2022\uf0b7]\s*)?([\s\S]*?)\(([^)]*?[\u4e00-\u9fa5]+[^)]*?)\)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const numStr = match[1];
    let english = match[2].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    const chinese = match[3].replace(/\n/g, '').trim();

    english = english.replace(/^[\u2022\uf0b7\s]+/, '').trim();
    if (!english || !chinese || english.length < 2) continue;

    const id = numStr ? parseInt(numStr, 10) : idCounter;
    idCounter = id + 1;

    let topicId = 'daily';
    if (id >= 86 && id <= 250) topicId = 'workplace';
    else if (id >= 251 && id <= 550) topicId = 'tech';
    else if (id >= 551) topicId = 'slang';

    results.push({
      id: String(id),
      topicId,
      english,
      chinese,
    });
  }

  return results;
}

try {
  const text = fs.readFileSync(inputPath, 'utf-8');
  const results = parseSentences(text);
  const tsContent = fs.readFileSync(outputPath, 'utf-8');
  const replacement = `export const shortSentences: ShortSentence[] = [\n${results
    .map(item => `  { id: '${item.id}', topicId: '${item.topicId}', english: ${JSON.stringify(item.english)}, chinese: ${JSON.stringify(item.chinese)} }`)
    .join(',\n')}\n];`;

  const updated = tsContent.replace(
    /export const shortSentences: ShortSentence\[\] = \[[\s\S]*?\];/,
    replacement
  );

  fs.writeFileSync(outputPath, updated, 'utf-8');
  console.log(`Parsed ${results.length} sentences and updated ${outputPath}.`);
} catch (error) {
  console.error('Usage: node process_corpus.cjs <input.txt> [output.ts]');
  console.error(error);
  process.exit(1);
}
