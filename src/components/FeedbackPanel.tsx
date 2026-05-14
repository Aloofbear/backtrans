import Markdown from 'react-markdown';
import { AlertCircle, CheckCircle2, Lightbulb, Sparkles, Target } from 'lucide-react';
import type { AnalysisFeedback } from '../types/learning';

interface FeedbackPanelProps {
  feedback: AnalysisFeedback | string;
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

export default function FeedbackPanel({ feedback }: FeedbackPanelProps) {
  if (typeof feedback === 'string') {
    return (
      <div className="prose prose-invert prose-p:text-text-main prose-headings:text-text-main prose-strong:text-primary max-w-none">
        <Markdown>{feedback}</Markdown>
      </div>
    );
  }

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
          总体诊断
        </div>
        <p className="leading-relaxed text-text-main">{feedback.summary}</p>
      </section>

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
                <div key={index} className="rounded-xl border border-border bg-surface p-3">
                  <div className="font-bold text-primary">{item.expression}</div>
                  <div className="mt-1 text-sm">{item.meaning}</div>
                  {item.reason && <div className="mt-1 text-xs text-text-muted">{item.reason}</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        {feedback.vocabulary.length > 0 && (
          <section className="rounded-2xl border border-border bg-background p-5">
            <div className="mb-3 font-bold">重要表达与生词</div>
            <div className="space-y-3">
              {feedback.vocabulary.map((item, index) => (
                <div key={index} className="rounded-xl border border-border bg-surface p-3">
                  <div className="font-bold text-primary">{item.expression}</div>
                  <div className="mt-1 text-sm">{item.meaning}</div>
                </div>
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
    </div>
  );
}

