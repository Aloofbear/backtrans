import { createLocalFeedback } from './fallbackFeedback';
import type { AnalysisFeedback, ExpressionItem, FeedbackIssue } from '../types/learning';

export interface AnalyzeTranslationInput {
  chinese: string;
  english: string;
  userTranslation: string;
}

const DEFAULT_DIMENSIONS = {
  accuracy: 60,
  grammar: 60,
  vocabulary: 60,
  naturalness: 60,
};

const DEFAULT_REMOTE_API_BASE = 'https://github-backtrans.vercel.app';

function numberInRange(value: unknown, fallback: number) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.max(0, Math.min(100, Math.round(numberValue)));
}

function normalizeStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  return value.map(item => String(item).trim()).filter(Boolean);
}

function normalizeExpressions(value: unknown): ExpressionItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => ({
      expression: String(item?.expression ?? item?.word ?? '').trim(),
      meaning: String(item?.meaning ?? item?.chinese ?? item?.definition ?? '').trim(),
      reason: item?.reason ? String(item.reason).trim() : undefined,
    }))
    .filter(item => item.expression && item.meaning);
}

function normalizeIssues(value: unknown): FeedbackIssue[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => {
      const severity = ['low', 'medium', 'high'].includes(item?.severity) ? item.severity : 'medium';
      return {
        title: String(item?.title ?? '表达问题').trim(),
        severity,
        userText: item?.userText ? String(item.userText).trim() : undefined,
        suggestion: String(item?.suggestion ?? '').trim(),
        explanation: String(item?.explanation ?? '').trim(),
      } satisfies FeedbackIssue;
    })
    .filter(item => item.title && item.explanation);
}

export function normalizeFeedback(value: any, provider: AnalysisFeedback['provider'] = 'ai'): AnalysisFeedback {
  const dimensions = value?.dimensions ?? {};

  return {
    provider,
    overallScore: numberInRange(value?.overallScore ?? value?.score, 60),
    dimensions: {
      accuracy: numberInRange(dimensions.accuracy, DEFAULT_DIMENSIONS.accuracy),
      grammar: numberInRange(dimensions.grammar, DEFAULT_DIMENSIONS.grammar),
      vocabulary: numberInRange(dimensions.vocabulary, DEFAULT_DIMENSIONS.vocabulary),
      naturalness: numberInRange(dimensions.naturalness, DEFAULT_DIMENSIONS.naturalness),
    },
    summary: String(value?.summary ?? 'AI 已完成分析。').trim(),
    strengths: normalizeStringArray(value?.strengths, ['已完成一次完整输出。']),
    issues: normalizeIssues(value?.issues),
    nativeExpressions: normalizeExpressions(value?.nativeExpressions),
    vocabulary: normalizeExpressions(value?.vocabulary),
    nextSteps: normalizeStringArray(value?.nextSteps, ['复盘原文表达并重做一次。']),
    warning: value?.warning ? String(value.warning) : undefined,
    rawText: value?.rawText ? String(value.rawText) : undefined,
  };
}

function getApiEndpoint() {
  const configuredBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  if (configuredBase) {
    return `${configuredBase}/api/analyze-translation`;
  }

  if (window.location.hostname.endsWith('github.io')) {
    return `${DEFAULT_REMOTE_API_BASE}/api/analyze-translation`;
  }

  return '/api/analyze-translation';
}

export async function analyzeTranslation(input: AnalyzeTranslationInput): Promise<AnalysisFeedback> {
  const endpoint = getApiEndpoint();
  if (!endpoint) {
    return createLocalFeedback({
      ...input,
      warning: '当前 GitHub Pages 静态环境未配置 AI 后端，已切换为本地诊断。',
    });
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Request failed with ${response.status}`);
    }

    const data = await response.json();
    return normalizeFeedback(data.feedback ?? data, 'ai');
  } catch (error: any) {
    return createLocalFeedback({
      ...input,
      warning: `AI 分析接口暂不可用，已临时切换为本地诊断。当前请求地址：${endpoint}。原因：${error?.message || '未知错误'}`,
    });
  }
}
