import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookMarked, History, Loader2, RefreshCcw, Send, Sparkles } from 'lucide-react';
import { analyzeTranslation } from '../lib/analysisClient';
import { useAuth } from '../contexts/AuthContext';
import { getFutureDateString, getScopedStorageKey, getTodayDateString, readJson, writeJson } from '../lib/storage';
import { getReviewableTranslationRecords } from '../lib/learningProduct';
import { trackEvent } from '../lib/analytics';
import FeedbackPanel from '../components/FeedbackPanel';
import type { AnalysisFeedback, ErrorBookEntry, ExpressionItem, PracticeHistoryRecord } from '../types/learning';

function getExpressionsFromFeedback(feedback: AnalysisFeedback): ExpressionItem[] {
  const unique = new Map<string, ExpressionItem>();
  [...feedback.nativeExpressions, ...feedback.vocabulary].forEach(item => {
    const key = item.expression.toLowerCase();
    if (!unique.has(key)) unique.set(key, item);
  });
  return Array.from(unique.values()).slice(0, 8);
}

export default function ReviewBacktranslationPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<PracticeHistoryRecord[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [translation, setTranslation] = useState('');
  const [feedback, setFeedback] = useState<AnalysisFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const historyKey = getScopedStorageKey('practiceHistory', user);
    const records = readJson<PracticeHistoryRecord[]>(historyKey, []);
    setHistory(records);
    const reviewable = getReviewableTranslationRecords(records);
    if (reviewable[0]) setSelectedId(String(reviewable[0].id));
  }, [user]);

  const reviewableRecords = useMemo(() => getReviewableTranslationRecords(history), [history]);
  const selectedRecord = reviewableRecords.find(record => String(record.id) === selectedId) || reviewableRecords[0];
  const item = selectedRecord?.item;

  const handleSubmit = async () => {
    if (!item || !translation.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setFeedback(null);
    setError('');
    const submitStartedAt = performance.now();
    trackEvent('review_submit', {
      corpusId: item.id,
      sourceHistoryId: selectedRecord?.id || null,
      length: translation.trim().length,
    }, user);

    try {
      const analysis = await analyzeTranslation({
        chinese: item.chinese,
        english: item.english,
        userTranslation: translation,
      });

      setFeedback(analysis);
      trackEvent('ai_feedback_success', {
        corpusId: item.id,
        mode: 'review',
        provider: analysis.provider,
        score: analysis.overallScore,
        issueCount: analysis.issues.length,
        durationMs: Math.round(performance.now() - submitStartedAt),
      }, user);
      const historyKey = getScopedStorageKey('practiceHistory', user);
      const allHistory = readJson<PracticeHistoryRecord[]>(historyKey, []);
      const historyId = Date.now();
      const record: PracticeHistoryRecord = {
        id: historyId,
        userId: user || 'guest',
        title: `复习：${item.chinese.length > 12 ? `${item.chinese.substring(0, 12)}...` : item.chinese}`,
        type: '回译',
        score: analysis.overallScore,
        timestamp: new Date().toISOString(),
        corpusId: item.id,
        item,
        userTranslation: translation,
        feedback: analysis,
        mode: 'review',
        sourceHistoryId: selectedRecord?.id,
      };
      writeJson(historyKey, [record, ...allHistory]);
      setHistory([record, ...allHistory]);

      const errorBookKey = getScopedStorageKey('errorBook', user);
      const errorBook = readJson<ErrorBookEntry[]>(errorBookKey, []);
      const expressions = getExpressionsFromFeedback(analysis);
      if (expressions.length > 0) {
        writeJson(errorBookKey, [{
          id: historyId,
          type: 'translation',
          corpusId: item.id,
          corpusTitle: item.chinese.length > 20 ? `${item.chinese.substring(0, 20)}...` : item.chinese,
          expressions,
          source: item.chinese,
          user: translation,
          correction: item.english,
          note: analysis.summary,
          date: getTodayDateString(),
          dueDate: getFutureDateString(7),
          timesReviewed: 1,
          status: 'reviewing',
        }, ...errorBook]);
      }
    } catch (err: any) {
      trackEvent('ai_feedback_failed', {
        corpusId: item.id,
        mode: 'review',
        durationMs: Math.round(performance.now() - submitStartedAt),
      }, user);
      setError(`复习分析失败：${err?.message || '未知错误'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (reviewableRecords.length === 0) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6 md:p-10">
        <div className="rounded-2xl border border-border bg-surface p-10 text-center">
          <BookMarked className="mx-auto mb-4 h-12 w-12 text-text-muted opacity-50" />
          <h1 className="mb-2 text-2xl font-bold">还没有可复习的回译材料</h1>
          <p className="mb-6 text-text-muted">先完成一次回译训练，这里就会出现可选择的复习语料。</p>
          <Link to="/corpus" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-background">
            去完成第一次回译
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 pb-32 sm:p-6 md:p-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold">
            <div className="rounded-lg bg-purple-500/20 p-2 text-purple-400">
              <RefreshCcw className="h-6 w-6" />
            </div>
            复习回译
          </h1>
          <p className="text-text-muted">选择做过的语料重新回译，比较自己的第二次表达是否更准确、更自然。</p>
        </div>
        <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-muted">
          可复习 {reviewableRecords.length} 篇
        </div>
      </div>

      {error && <div className="rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-3 rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 px-2 font-bold">
            <History className="h-5 w-5 text-purple-400" />
            已练语料
          </div>
          <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
            {reviewableRecords.map(record => (
              <button
                key={record.id}
                onClick={() => {
                  trackEvent('review_material_select', {
                    corpusId: record.corpusId || null,
                    score: record.score,
                    sourceHistoryId: record.id,
                  }, user);
                  setSelectedId(String(record.id));
                  setTranslation('');
                  setFeedback(null);
                }}
                className={`w-full rounded-xl border p-3 text-left transition-colors ${
                  String(record.id) === String(selectedRecord?.id)
                    ? 'border-purple-500/40 bg-purple-500/10'
                    : 'border-border bg-background hover:border-purple-500/30'
                }`}
              >
                <div className="line-clamp-2 text-sm font-bold">{record.title}</div>
                <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
                  <span>{new Date(record.timestamp).toLocaleDateString('zh-CN')}</span>
                  <span>{record.score} 分</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="space-y-6">
          {item && (
            <div className="grid gap-6 xl:grid-cols-2">
              <section className="rounded-2xl border border-border bg-surface p-5">
                <h2 className="mb-4 font-bold">中文原文</h2>
                <p className="whitespace-pre-wrap leading-relaxed">{item.chinese}</p>
              </section>
              <section className="rounded-2xl border border-border bg-surface p-5">
                <h2 className="mb-4 font-bold text-text-muted">上次你的译文</h2>
                <p className="whitespace-pre-wrap leading-relaxed text-text-muted">{selectedRecord?.userTranslation || '旧记录暂无译文'}</p>
              </section>
            </div>
          )}

          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="mb-4 font-bold">这次重新翻译</h2>
            <textarea
              value={translation}
              onChange={event => setTranslation(event.target.value)}
              placeholder="重新写一版英文译文..."
              className="min-h-[220px] w-full resize-none rounded-xl border border-border bg-background p-5 text-base leading-relaxed outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={!translation.trim() || isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-background transition-colors hover:bg-primary-hover disabled:border disabled:border-border disabled:bg-surface disabled:text-text-muted"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                提交复习
              </button>
            </div>
          </section>

          {feedback && (
            <section className="rounded-2xl border border-primary/30 bg-surface p-5 md:p-8">
              <div className="mb-6 flex items-center gap-2 text-xl font-bold">
                <Sparkles className="h-5 w-5 text-primary" />
                复习分析
              </div>
              <FeedbackPanel feedback={feedback} userId={user} sourceTitle={item?.chinese.substring(0, 24)} />
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
