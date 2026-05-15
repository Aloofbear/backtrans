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
const REQUEST_TIMEOUT_MS = 12000;

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

function splitApiBases(value: string | undefined) {
  return (value || '')
    .split(',')
    .map(item => item.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function getApiEndpoints() {
  const candidates = [
    ...splitApiBases(import.meta.env.VITE_API_BASE_URLS),
    ...splitApiBases(import.meta.env.VITE_API_BASE_URL),
  ];

  if (!window.location.hostname.endsWith('github.io')) {
    candidates.push('');
  }
  if (window.location.hostname.endsWith('github.io')) {
    candidates.push(DEFAULT_REMOTE_API_BASE);
  }

  return Array.from(new Set(candidates)).map(base => `${base}/api/analyze-translation`);
}

async function postForAnalysis(endpoint: string, input: AnalyzeTranslationInput) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Request failed with ${response.status}`);
    }

    return response.json();
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function analyzeTranslation(input: AnalyzeTranslationInput): Promise<AnalysisFeedback> {
  const endpoints = getApiEndpoints();
  const errors: string[] = [];

  for (const endpoint of endpoints) {
    try {
      const data = await postForAnalysis(endpoint, input);
      return normalizeFeedback(data.feedback ?? data, 'ai');
    } catch (error: any) {
      const message = error?.name === 'AbortError' ? '请求超时' : error?.message || '未知错误';
      errors.push(`${endpoint}: ${message}`);
    }
  }

  return createLocalFeedback({
    ...input,
    warning: `AI 分析接口在当前网络下不可达，已临时切换为本地诊断。已尝试：${errors.join('；')}`,
  });
}
