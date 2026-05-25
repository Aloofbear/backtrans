import { useState } from 'react';
import Markdown from 'react-markdown';
import { AlertCircle, BookmarkPlus, CheckCircle2, ChevronDown, ChevronUp, Lightbulb, Sparkles, Target } from 'lucide-react';
import { saveFavoriteExpression } from '../lib/learningProduct';
import { trackEvent } from '../lib/analytics';
import type { AnalysisFeedback, ExpressionItem } from '../types/learning';

interface FeedbackPanelProps {
  feedback: AnalysisFeedback | string;
  userId?: string | null;
  sourceTitle?: string;
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-text-muted">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-background">
        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function DetailSections({
  feedback,
  onFavorite,
}: {
  feedback: AnalysisFeedback;
  onFavorite: (item: ExpressionItem) => void;
}) {
  return (
    <>
      {feedback.strengths.length > 0 && (
        <section className="rounded-2xl border border-success/30 bg-success/5 p-5">
          <div className="mb-3 flex items-center gap-2 font-bold text-success">
            <CheckCircle2 className="h-5 w-5" />
            做得不错
          </div>
          <div className="space-y-2 text-sm">
            {feedback.strengths.map((item, index) => (
              <p key={index}>{item}</p>
            ))}
          </div>
        </section>
      )}

      {feedback.issues.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="h-5 w-5 text-warning" />
            重点问题
          </div>
          {feedback.issues.map((issue, index) => (
            <div key={index} className="rounded-2xl border border-border bg-background p-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h4 className="font-bold">{issue.title}</h4>
                <span className="rounded-full border border-border px-2 py-1 text-xs text-text-muted">
                  {issue.severity === 'high' ? '高优先级' : issue.severity === 'medium' ? '中优先级' : '低优先级'}
                </span>
              </div>
              {issue.userText && <p className="mb-2 text-sm text-text-muted">你的表达：{issue.userText}</p>}
              {issue.suggestion && <p className="mb-2 text-sm text-primary">建议表达：{issue.suggestion}</p>}
              <p className="text-sm leading-relaxed">{issue.explanation}</p>
            </div>
          ))}
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {feedback.nativeExpressions.length > 0 && (
          <section className="rounded-2xl border border-border bg-background p-5">
            <div className="mb-3 font-bold">地道表达</div>
            <div className="space-y-3">
              {feedback.nativeExpressions.map((item, index) => (
                <ExpressionCard key={index} item={item} onFavorite={onFavorite} />
              ))}
            </div>
          </section>
        )}

        {feedback.vocabulary.length > 0 && (
          <section className="rounded-2xl border border-border bg-background p-5">
            <div className="mb-3 font-bold">重要表达与生词</div>
            <div className="space-y-3">
              {feedback.vocabulary.map((item, index) => (
                <ExpressionCard key={index} item={item} onFavorite={onFavorite} compact />
              ))}
            </div>
          </section>
        )}
      </div>

      {feedback.nextSteps.length > 0 && (
        <section className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-5">
          <div className="mb-3 flex items-center gap-2 font-bold text-blue-400">
            <Lightbulb className="h-5 w-5" />
            下一步训练
          </div>
          <div className="space-y-2 text-sm">
            {feedback.nextSteps.map((item, index) => (
              <p key={index}>{index + 1}. {item}</p>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function ExpressionCard({ item, onFavorite, compact = false }: { item: ExpressionItem; onFavorite: (item: ExpressionItem) => void; compact?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-bold text-primary">{item.expression}</div>
          <div className="mt-1 text-sm">{item.meaning}</div>
          {!compact && item.reason && <div className="mt-1 text-xs text-text-muted">{item.reason}</div>}
        </div>
        <button
          type="button"
          onClick={() => onFavorite(item)}
          className="shrink-0 rounded-lg border border-border p-2 text-text-muted transition-colors hover:border-primary/40 hover:text-primary"
          title="收藏表达"
        >
          <BookmarkPlus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function FeedbackPanel({ feedback, userId, sourceTitle }: FeedbackPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [favoriteToast, setFavoriteToast] = useState('');

  if (typeof feedback === 'string') {
    return (
      <div className="prose prose-invert prose-p:text-text-main prose-headings:text-text-main prose-strong:text-primary max-w-none">
        <Markdown>{feedback}</Markdown>
      </div>
    );
  }

  const topIssues = feedback.issues.slice(0, 3);
  const handleFavorite = (item: ExpressionItem) => {
    saveFavoriteExpression(userId, item, sourceTitle);
    trackEvent('expression_favorite', {
      provider: feedback.provider,
      score: feedback.overallScore,
      expressionLength: item.expression.length,
      hasReason: Boolean(item.reason),
    }, userId);
    setFavoriteToast(`已收藏：${item.expression}`);
    window.setTimeout(() => setFavoriteToast(''), 1600);
  };

  return (
    <div className="space-y-6">
      {feedback.warning && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{feedback.warning}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-[160px_1fr]">
        <div className="rounded-2xl border border-primary/30 bg-background p-5 text-center">
          <div className="text-xs font-medium uppercase text-text-muted">综合分</div>
          <div className="mt-2 text-5xl font-bold text-primary">{feedback.overallScore}</div>
          <div className="mt-1 text-xs text-text-muted">{feedback.provider === 'ai' ? 'AI 评分' : '本地诊断'}</div>
        </div>
        <div className="rounded-2xl border border-border bg-background p-5">
          <div className="mb-4 flex items-center gap-2 font-bold">
            <Sparkles className="h-5 w-5 text-primary" />
            分项能力
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ScoreBar label="准确度" value={feedback.dimensions.accuracy} />
            <ScoreBar label="语法" value={feedback.dimensions.grammar} />
            <ScoreBar label="词汇" value={feedback.dimensions.vocabulary} />
            <ScoreBar label="自然度" value={feedback.dimensions.naturalness} />
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-background p-5">
        <div className="mb-3 flex items-center gap-2 font-bold">
          <Target className="h-5 w-5 text-primary" />
          一句话诊断
        </div>
        <p className="leading-relaxed text-text-main">{feedback.summary}</p>
      </section>

      {topIssues.length > 0 && (
        <section className="rounded-2xl border border-warning/30 bg-warning/5 p-5">
          <div className="mb-3 flex items-center gap-2 font-bold text-warning">
            <AlertCircle className="h-5 w-5" />
            优先改这 {topIssues.length} 处
          </div>
          <div className="space-y-3">
            {topIssues.map((issue, index) => (
              <div key={index} className="rounded-xl border border-border bg-background p-4">
                <div className="mb-1 font-bold">{issue.title}</div>
                {issue.suggestion && <div className="text-sm text-primary">建议：{issue.suggestion}</div>}
                <p className="mt-1 text-sm text-text-muted">{issue.explanation}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {favoriteToast && (
        <div className="rounded-xl border border-success/30 bg-success/10 p-3 text-sm text-success">
          {favoriteToast}
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          if (!expanded) {
            trackEvent('feedback_expand', {
              provider: feedback.provider,
              score: feedback.overallScore,
              issueCount: feedback.issues.length,
              nativeExpressionCount: feedback.nativeExpressions.length,
              vocabularyCount: feedback.vocabulary.length,
            }, userId);
          }
          setExpanded(!expanded);
        }}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-text-main transition-colors hover:border-primary/40 hover:text-primary"
      >
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        {expanded ? '收起详情' : '展开详细分析'}
      </button>

      {expanded && (
        <DetailSections
          feedback={feedback}
          onFavorite={handleFavorite}
        />
      )}
    </div>
  );
}
