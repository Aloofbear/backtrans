import fs from 'node:fs';

const shortCorpus = fs.readFileSync('src/data/shortSentenceCorpus.ts', 'utf-8');
const longCorpus = fs.readFileSync('src/data/corpus.ts', 'utf-8');

const errors: string[] = [];

function countMatches(source: string, pattern: RegExp) {
  return Array.from(source.matchAll(pattern)).length;
}

const declaredCounts = Array.from(shortCorpus.matchAll(/count:\s*(\d+)/g)).map(match => Number(match[1]));
const topicCounts = new Map<string, number>();

for (const match of shortCorpus.matchAll(/topicId:\s*'([^']+)'/g)) {
  topicCounts.set(match[1], (topicCounts.get(match[1]) || 0) + 1);
}

for (const count of declaredCounts) {
  if (!Array.from(topicCounts.values()).includes(count)) {
    errors.push(`Declared topic count ${count} does not match any actual topic count.`);
  }
}

for (const match of shortCorpus.matchAll(/\{\s*id:\s*'([^']+)'.*?english:\s*"([^"]*)".*?chinese:\s*"([^"]*)"/g)) {
  const [, id, english, chinese] = match;
  if (english.length < 4) errors.push(`Short sentence ${id} has suspiciously short English text.`);
  if (!/[\u4e00-\u9fa5]/.test(chinese)) errors.push(`Short sentence ${id} has no Chinese text.`);
  if (/most u•|^sers\.$|MVP"$/.test(english)) errors.push(`Short sentence ${id} looks corrupted: ${english}`);
}

if (countMatches(longCorpus, /\{\s*id:\s*"/g) < 10) {
  errors.push('Long-form corpus has fewer than 10 items.');
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Corpus QA passed. Short sentences: ${countMatches(shortCorpus, /\{\s*id:\s*'/g)}.`);
