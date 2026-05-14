import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookMarked, CheckCircle2, Clipboard, RefreshCcw, Sparkles } from 'lucide-react';
import { corpus, CorpusItem } from '../data/corpus';
import { useAuth } from '../contexts/AuthContext';
import { getFutureDateString, getScopedStorageKey, getTodayDateString, readJson, writeJson } from '../lib/storage';
import FeedbackPanel from '../components/FeedbackPanel';
import type { AnalysisFeedback, ErrorBookEntry, ExpressionItem, PracticeHistoryRecord } from '../types/learning';

interface AnalysisData {
  item: CorpusItem;
  userTranslation: string;
  feedback: AnalysisFeedback | string;
}

function getExpressions(feedback: AnalysisFeedback | string): ExpressionItem[] {
  if (typeof feedback === 'string') return [];
  const unique = new Map<string, ExpressionItem>();
  [...feedback.nativeExpressions, ...feedback.vocabulary].forEach(item => {
    if (!unique.has(item.expression.toLowerCase())) unique.set(item.expression.toLowerCase(), item);
  });
  return Array.from(unique.values()).slice(0, 8);
}

export default function AnalysisResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<AnalysisData | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const historyKey = getScopedStorageKey('practiceHistory', user);
    const allHistory = readJson<PracticeHistoryRecord[]>(historyKey, []);
    const historyItem = allHistory.find(record => String(record.id) === id);

    if (historyItem?.item && historyItem.feedback) {
      setData({
        item: historyItem.item,
        userTranslation: historyItem.userTranslation || '',
        feedback: historyItem.feedback,
      });
      return;
    }

    const savedData = localStorage.getItem('lastAnalysisResult');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.item?.id === id || String(parsed.timestamp) === id) {
          setData(parsed);
          return;
        }
      } catch (error) {
        console.error('Error parsing lastAnalysisResult:', error);
      }
    }

    if (historyItem) {
      const corpusItem = corpus.find(c => c.id === historyItem.corpusId || c.chinese.includes(historyItem.title.replace('...', '')));
      if (corpusItem) {
        setData({
          item: corpusItem,
          userTranslation: historyItem.userTranslation || '（旧记录暂无翻译备份）',
          feedback: historyItem.feedback || '（旧记录暂无分析备份）',
        });
        return;
      }
    }

    const directCorpusItem = corpus.find(c => c.id === id);
    if (directCorpusItem) {
      setData({ item: directCorpusItem, userTranslation: '', feedback: '' });
      return;
    }

    navigate('/history');
  }, [id, navigate, user]);

  const handleSaveToErrorBook = () => {
    if (!data || isSaved) return;

    const errorBookKey = getScopedStorageKey('errorBook', user);
    const errorItems = readJson<ErrorBookEntry[]>(errorBookKey, []);
    const expressions = getExpressions(data.feedback);

    const newItem: ErrorBookEntry = {
      id: Date.now(),
      type: 'translation',
      corpusId: data.item.id,
      corpusTitle: data.item.chinese.length > 20 ? `${data.item.chinese.substring(0, 20)}...` : data.item.chinese,
      expressions,
      source: data.item.chinese,
      user: data.userTranslation,
      correction: data.item.english,
      note: typeof data.feedback === 'string' ? data.feedback.substring(0, 200) : data.feedback.summary,
      date: getTodayDateString(),
      dueDate: getFutureDateString(1),
      timesReviewed: 0,
      status: 'new',
    };

    writeJson(errorBookKey, [newItem, ...errorItems]);
    setIsSaved(true);
  };

  const handleCopySummary = async () => {
    if (!data) return;
    const summary = typeof data.feedback === 'string' ? data.feedback : data.feedback.summary;
    await navigator.clipboard.writeText(`BackTrans 练习总结\n\n${summary}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!data) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 pb-32 md:p-10">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/history')}
          className="flex items-center gap-2 text-text-muted transition-colors hover:text-text-main"
        >
          <ArrowLeft className="h-4 w-4" /> 返回记录
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopySummary}
            className="rounded-lg border border-border bg-surface p-2 text-text-muted transition-colors hover:text-primary"
            title="复制总结"
          >
            <Clipboard className="h-4 w-4" />
          </button>
          <button
            onClick={handleSaveToErrorBook}
            className={`rounded-lg border p-2 transition-colors ${
              isSaved
                ? 'border-purple-500/30 bg-purple-500/10 text-purple-400'
                : 'border-border bg-surface text-text-muted hover:text-purple-400'
            }`}
            title={isSaved ? '已加入错题本' : '加入错题本'}
          >
            <BookMarked className="h-4 w-4" />
          </button>
        </div>
      </div>

      {copied && (
        <div className="rounded-xl border border-success/30 bg-success/10 p-3 text-sm text-success">
          已复制练习总结
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-success/30 bg-surface p-6">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full bg-success/10 blur-2xl"></div>
            <div className="relative z-10 mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <h3 className="font-bold text-success">地道原文 (Original)</h3>
            </div>
            <p className="relative z-10 whitespace-pre-wrap text-lg font-medium">{data.item.english}</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6">
            <h3 className="mb-4 text-sm font-bold text-text-muted">你的翻译 (Your Translation)</h3>
            <p className="whitespace-pre-wrap text-lg">{data.userTranslation}</p>
          </div>

          <div className="rounded-2xl border border-border bg-background p-6 opacity-80">
            <h3 className="mb-2 text-xs font-bold uppercase text-text-muted">中文参考</h3>
            <p className="whitespace-pre-wrap text-sm">{data.item.chinese}</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-surface p-6 shadow-[0_0_30px_rgba(0,216,255,0.05)] md:p-8">
          <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl"></div>

          <div className="relative z-10 mb-8 flex items-center gap-2">
            <div className="rounded-lg bg-primary/20 p-2 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold">分析结果</h2>
          </div>

          <div className="relative z-10">
            <FeedbackPanel feedback={data.feedback} />
          </div>
        </div>
      </div>

      <div className="flex justify-center border-t border-border/50 pt-8">
        <Link
          to="/corpus"
          className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-bold text-background shadow-[0_0_20px_rgba(0,216,255,0.2)] transition-all hover:scale-105 hover:bg-primary-hover"
        >
          <RefreshCcw className="h-5 w-5" />
          <span>继续下一篇</span>
        </Link>
      </div>
    </div>
  );
}
