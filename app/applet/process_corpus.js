const fs = require('fs');

try {
  const logPath = '/.gemini/antigravity/brain/a6639bfd-6033-438c-a0e1-2833f5daf43a/.system_generated/logs/overview.txt';
  const logContent = fs.readFileSync(logPath, 'utf-8');

  // Extract all OCR blocks
  const ocrRegex = /==Start of OCR for page \d+==\n([\s\S]*?)==End of OCR for page \d+==/g;
  let text = '';
  let match;
  while ((match = ocrRegex.exec(logContent)) !== null) {
    text += match[1] + '\n';
  }

  if (!text) {
    console.log("No OCR text found in logs.");
    process.exit(1);
  }

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

  let tsContent = fs.readFileSync('src/data/shortSentenceCorpus.ts', 'utf-8');
  tsContent = tsContent.replace(/export const shortSentences: ShortSentence\[\] = \[[\s\S]*?\];/, `export const shortSentences: ShortSentence[] = [\n${results.join(',\n')}\n];`);

  fs.writeFileSync('src/data/shortSentenceCorpus.ts', tsContent, 'utf-8');
  console.log("Parsed " + results.length + " sentences and updated the corpus.");
} catch (error) {
  console.error("Error:", error);
}
