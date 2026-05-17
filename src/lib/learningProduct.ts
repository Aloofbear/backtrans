import type { CorpusItem } from '../data/corpus';
import type { ErrorBookEntry, FavoriteExpression, PracticeHistoryRecord, AnalysisFeedback, ExpressionItem } from '../types/learning';
import { getScopedStorageKey, getTodayDateString, readJson, writeJson } from './storage';

export type DifficultyFilter = 'all' | 'starter' | 'standard' | 'challenge';
export type LengthFilter = 'all' | 'micro' | 'short' | 'long';
export type GoalFilter = 'all' | 'accuracy' | 'grammar' | 'vocabulary' | 'naturalness';

export interface CorpusInsight {
  difficulty: Exclude<DifficultyFilter, 'all'>;
  difficultyLabel: string;
  length: Exclude<LengthFilter, 'all'>;
  lengthLabel: string;
  goal: Exclude<GoalFilter, 'all'>;
  goalLabel: string;
  estimatedMinutes: number;
  sentenceCount: number;
}

function countSentences(text: string) {
  const matches = text.match(/[。！？.!?]+/g);
  return Math.max(1, matches?.length || 1);
}

export function getCorpusInsight(item: CorpusItem): CorpusInsight {
  const charCount = item.chinese.replace(/\s/g, '').length;
  const sentenceCount = countSentences(item.chinese);
  const paragraphCount = item.chinese.split(/\n+/).filter(Boolean).length;
  const estimatedMinutes = Math.max(2, Math.ceil(charCount / 95) + Math.max(0, paragraphCount - 1));

  const difficulty =
    charCount <= 150 ? 'starter' :
      charCount <= 210 ? 'standard' :
        'challenge';
  const length =
    sentenceCount <= 2 ? 'micro' :
      sentenceCount <= 5 ? 'short' :
        'long';

  let goal: CorpusInsight['goal'] = 'accuracy';
  if (/称|表示|说道|声明|强调|认为/.test(item.chinese)) goal = 'grammar';
  if (/AI|人工智能|系统|数据|广告|平台|技术/.test(item.chinese)) goal = 'vocabulary';
  if (/不仅|恰恰|毕竟|试想|画面|不光/.test(item.chinese)) goal = 'naturalness';

  return {
    difficulty,
    difficultyLabel: difficulty === 'starter' ? '轻量' : difficulty === 'standard' ? '标准' : '挑战',
    length,
    lengthLabel: length === 'micro' ? '1-2 句' : length === 'short' ? '短段' : '长段',
    goal,
    goalLabel: goal === 'accuracy' ? '准确传意' : goal === 'grammar' ? '句法结构' : goal === 'vocabulary' ? '术语词汇' : '地道表达',
    estimatedMinutes,
    sentenceCount,
  };
}

export function getDraftKey(corpusId: string, user: string | null | undefined) {
  return getScopedStorageKey(`translationDraft_${corpusId}`, user);
}

function getLocalDate(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getStreakDays(history: PracticeHistoryRecord[]) {
  const dates = new Set(history.map(record => getLocalDate(record.timestamp)).filter(Boolean));
  let streak = 0;
  const cursor = new Date();

  while (true) {
    const key = getLocalDate(cursor.toISOString());
    if (!dates.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function collectFeedback(history: PracticeHistoryRecord[]) {
  return history
    .map(record => record.feedback)
    .filter((feedback): feedback is AnalysisFeedback => Boolean(feedback) && typeof feedback !== 'string');
}

export function buildAbilityProfile(history: PracticeHistoryRecord[], errorBook: ErrorBookEntry[], favorites: FavoriteExpression[]) {
  const translationHistory = history.filter(record => record.type === '回译');
  const feedbacks = collectFeedback(translationHistory);
  const dimensions = {
    accuracy: average(feedbacks.map(item => item.dimensions.accuracy)),
    grammar: average(feedbacks.map(item => item.dimensions.grammar)),
    vocabulary: average(feedbacks.map(item => item.dimensions.vocabulary)),
    naturalness: average(feedbacks.map(item => item.dimensions.naturalness)),
  };

  const issueCounts = new Map<string, number>();
  feedbacks.forEach(feedback => {
    feedback.issues.forEach(issue => {
      issueCounts.set(issue.title, (issueCounts.get(issue.title) || 0) + 1);
    });
  });

  const sortedDimensions = Object.entries(dimensions)
    .sort((a, b) => a[1] - b[1])
    .map(([key, value]) => ({ key, value }));

  const recent = translationHistory.slice(0, 5).map(record => record.score);
  const previous = translationHistory.slice(5, 10).map(record => record.score);
  const trend = average(recent) - average(previous);

  const today = getTodayDateString();
  const weekCount = history.filter(record => {
    const diff = Date.now() - new Date(record.timestamp).getTime();
    return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  return {
    averageScore: average(translationHistory.map(record => record.score).filter(score => score > 0)),
    dimensions,
    weakDimensions: sortedDimensions.slice(0, 2),
    strongestDimension: sortedDimensions[sortedDimensions.length - 1],
    topIssues: Array.from(issueCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([title, count]) => ({ title, count })),
    trend,
    streakDays: getStreakDays(history),
    weekCount,
    translationCount: translationHistory.length,
    reviewCount: translationHistory.filter(record => record.mode === 'review').length,
    dueReviews: errorBook.filter(item => item.status !== 'mastered' && (!item.dueDate || item.dueDate <= today)).length,
    masteredExpressions: errorBook
      .filter(item => item.status === 'mastered')
      .reduce((sum, item) => sum + (item.expressions?.length || 0), 0),
    favoriteExpressions: favorites.length,
  };
}

export function getReviewableTranslationRecords(history: PracticeHistoryRecord[]) {
  const latestByCorpus = new Map<string, PracticeHistoryRecord>();

  history
    .filter(record => record.type === '回译' && record.item && record.corpusId)
    .forEach(record => {
      const existing = latestByCorpus.get(record.corpusId!);
      if (!existing || new Date(record.timestamp).getTime() > new Date(existing.timestamp).getTime()) {
        latestByCorpus.set(record.corpusId!, record);
      }
    });

  return Array.from(latestByCorpus.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function saveFavoriteExpression(user: string | null | undefined, item: ExpressionItem, sourceTitle?: string) {
  const key = getScopedStorageKey('favoriteExpressions', user);
  const existing = readJson<FavoriteExpression[]>(key, []);
  const normalized = item.expression.trim().toLowerCase();
  if (!normalized || existing.some(entry => entry.expression.trim().toLowerCase() === normalized)) {
    return existing;
  }

  const next = [
    {
      id: Date.now(),
      expression: item.expression,
      meaning: item.meaning,
      reason: item.reason,
      sourceTitle,
      createdAt: new Date().toISOString(),
    },
    ...existing,
  ];
  writeJson(key, next);
  return next;
}
