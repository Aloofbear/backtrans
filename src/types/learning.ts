import type { CorpusItem } from '../data/corpus';

export type FeedbackProvider = 'ai' | 'local' | 'legacy';

export interface AnalysisDimensionScores {
  accuracy: number;
  grammar: number;
  vocabulary: number;
  naturalness: number;
}

export interface FeedbackIssue {
  title: string;
  severity: 'low' | 'medium' | 'high';
  userText?: string;
  suggestion: string;
  explanation: string;
}

export interface ExpressionItem {
  expression: string;
  meaning: string;
  reason?: string;
}

export interface AnalysisFeedback {
  provider: FeedbackProvider;
  overallScore: number;
  dimensions: AnalysisDimensionScores;
  summary: string;
  strengths: string[];
  issues: FeedbackIssue[];
  nativeExpressions: ExpressionItem[];
  vocabulary: ExpressionItem[];
  nextSteps: string[];
  warning?: string;
  rawText?: string;
}

export interface PracticeHistoryRecord {
  id: number;
  userId: string;
  title: string;
  type: '回译' | '短句';
  score: number;
  timestamp: string;
  item?: CorpusItem;
  corpusId?: string;
  topicId?: string;
  sentenceId?: string;
  userTranslation?: string;
  feedback?: AnalysisFeedback | string;
  isCorrect?: boolean;
  mode?: 'practice' | 'review';
  sourceHistoryId?: number;
}

export interface ErrorBookEntry {
  id: number;
  type: 'translation' | 'short-sentence';
  corpusId?: string;
  corpusTitle: string;
  expressions: ExpressionItem[];
  source?: string;
  user?: string;
  correction?: string;
  note?: string;
  date: string;
  dueDate: string;
  timesReviewed: number;
  status: 'new' | 'reviewing' | 'mastered';
}

export interface FavoriteExpression {
  id: number;
  expression: string;
  meaning: string;
  reason?: string;
  sourceTitle?: string;
  createdAt: string;
}
