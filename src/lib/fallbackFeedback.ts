import type { AnalysisFeedback } from '../types/learning';

interface FallbackInput {
  chinese: string;
  english: string;
  userTranslation: string;
  warning?: string;
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'are', 'was', 'were',
  'have', 'has', 'had', 'but', 'not', 'you', 'your', 'our', 'their', 'they', 'will',
  'would', 'could', 'should', 'can', 'may', 'might', 'been', 'being', 'about',
]);

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, ' ')
    .split(/\s+/)
    .map(word => word.replace(/^'+|'+$/g, ''))
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function pickVocabulary(english: string, userTranslation: string) {
  const userWords = new Set(tokenize(userTranslation));
  const seen = new Set<string>();

  return tokenize(english)
    .filter(word => word.length >= 6 && !userWords.has(word))
    .filter(word => {
      if (seen.has(word)) return false;
      seen.add(word);
      return true;
    })
    .slice(0, 5)
    .map(word => ({
      expression: word,
      meaning: '原文中的关键词，建议结合语境复习它的搭配和用法。',
    }));
}

export function createLocalFeedback(input: FallbackInput): AnalysisFeedback {
  const sourceTokens = tokenize(input.english);
  const userTokens = tokenize(input.userTranslation);
  const userTokenSet = new Set(userTokens);
  const overlap = sourceTokens.filter(token => userTokenSet.has(token)).length;
  const overlapRatio = sourceTokens.length > 0 ? overlap / sourceTokens.length : 0;
  const lengthRatio = input.english.length > 0
    ? Math.min(input.userTranslation.length / input.english.length, 1.2)
    : 1;

  const score = clampScore(42 + overlapRatio * 42 + Math.min(lengthRatio, 1) * 16);
  const vocabulary = pickVocabulary(input.english, input.userTranslation);

  return {
    provider: 'local',
    overallScore: score,
    dimensions: {
      accuracy: clampScore(score + 2),
      grammar: clampScore(score - 3),
      vocabulary: clampScore(45 + overlapRatio * 45),
      naturalness: clampScore(score - 5),
    },
    summary: '当前展示的是本地诊断结果：它只根据原文关键词覆盖、长度完整度和表达差异给出基础反馈。AI 分析接口连通后，会自动切换为句法、搭配和地道度深度分析。',
    strengths: [
      input.userTranslation.trim().length > 0 ? '你已经完成了主动输出，这是回译训练中最关键的一步。' : '建议先完成英文输出，再进行分析。',
      overlap > 0 ? '你的译文覆盖了一部分原文关键词。' : '这次练习适合作为表达重构训练，从原文中积累关键词。',
    ],
    issues: [
      {
        title: 'AI 分析接口未连通',
        severity: 'medium',
        suggestion: '线上请使用 Vercel 站点，或让 GitHub Pages 指向 Vercel API；本地开发请同时运行 npm run dev:api。',
        explanation: '这不是对你译文内容的评价，而是系统未连通云端分析接口时的临时提示。前端不会保存 API Key，DeepSeek 密钥必须放在服务端环境变量中。',
      },
      {
        title: '重点复盘原文表达',
        severity: 'low',
        userText: input.userTranslation,
        suggestion: input.english,
        explanation: '建议逐句比较你的译文和原文，标出动词、介词搭配以及句子重心的不同。',
      },
    ],
    nativeExpressions: vocabulary.slice(0, 3).map(item => ({
      expression: item.expression,
      meaning: item.meaning,
      reason: '这是原文中值得优先复习的表达。',
    })),
    vocabulary,
    nextSteps: [
      '把原文中没有写出的关键词加入错题本。',
      '隔天重做同一段，不看英文原文，检查表达是否更贴近原句。',
      '优先复习动词短语和介词搭配，它们最影响英文自然度。',
    ],
    warning: input.warning,
  };
}
