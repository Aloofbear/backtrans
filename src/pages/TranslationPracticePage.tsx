import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  BookMarked,
  BookOpen,
  CheckCircle2,
  Edit3,
  Info,
  Loader2,
  RefreshCcw,
  Send,
  Sparkles,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { analyzeTranslation } from '../lib/analysisClient';
import { getFutureDateString, getScopedStorageKey, getTodayDateString, readJson, writeJson } from '../lib/storage';
import { corpus, CorpusItem } from '../data/corpus';
import { useAuth } from '../contexts/AuthContext';
import FeedbackPanel from '../components/FeedbackPanel';
import type { AnalysisFeedback, ErrorBookEntry, ExpressionItem, PracticeHistoryRecord } from '../types/learning';

function getExpressionsFromFeedback(feedback: AnalysisFeedback): ExpressionItem[] {
  const merged = [...feedback.nativeExpressions, ...feedback.vocabulary];
  const unique = new Map<string, ExpressionItem>();

  merged.forEach(item => {
    const key = item.expression.toLowerCase();
    if (!unique.has(key)) unique.set(key, item);
  });

  return Array.from(unique.values()).slice(0, 8);
}

export default function TranslationPracticePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState<CorpusItem | null>(null);
  const [userTranslation, setUserTranslation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [feedback, setFeedback] = useState<AnalysisFeedback | null>(null);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const foundItem = corpus.find(c => c.id === id);
    if (foundItem) {
      setItem(foundItem);
    } else {
      navigate('/corpus');
    }
  }, [id, navigate]);

  const saveToErrorBook = (analysis: AnalysisFeedback, auto = false) => {
    if (!item) return false;

    const expressions = getExpressionsFromFeedback(analysis);
    if (expressions.length === 0 && auto) return false;

    const errorBookKey = getScopedStorageKey('errorBook', user);
    const errorItems = readJson<ErrorBookEntry[]>(errorBookKey, []);

    const newItem: ErrorBookEntry = {
      id: Date.now(),
      type: 'translation',
      corpusId: item.id,
      corpusTitle: item.chinese.length > 20 ? `${item.chinese.substring(0, 20)}...` : item.chinese,
      expressions,
      source: item.chinese,
      user: userTranslation,
      correction: item.english,
      note: analysis.summary,
      date: getTodayDateString(),
      dueDate: getFutureDateString(auto ? 1 : 0),
      timesReviewed: 0,
      status: 'new',
    };

    writeJson(errorBookKey, [newItem, ...errorItems]);
    setIsSaved(true);
    return true;
  };

  const handleSubmit = async () => {
    if (!userTranslation.trim() || !item || isSubmitting) return;

    setIsSubmitting(true);
    setShowOriginal(true);
    setError('');
    setFeedback(null);
    setIsSaved(false);

    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    try {
      const analysis = await analyzeTranslation({
        chinese: item.chinese,
        english: item.english,
        userTranslation,
      });

      setFeedback(analysis);

      const completedKey = getScopedStorageKey('completedCorpusIds', user);
      const completedIds = readJson<string[]>(completedKey, []);
      if (!completedIds.includes(item.id)) {
        writeJson(completedKey, [...completedIds, item.id]);
      }

      const historyKey = getScopedStorageKey('practiceHistory', user);
      const history = readJson<PracticeHistoryRecord[]>(historyKey, []);
      const historyId = Date.now();
      const record: PracticeHistoryRecord = {
        id: historyId,
        userId: user || 'guest',
        title: item.chinese.length > 15 ? `${item.chinese.substring(0, 15)}...` : item.chinese,
        type: '回译',
        score: analysis.overallScore,
        timestamp: new Date().toISOString(),
        corpusId: item.id,
        item,
        userTranslation,
        feedback: analysis,
      };

      writeJson(historyKey, [record, ...history]);
      saveToErrorBook(analysis, true);
      writeJson('lastAnalysisResult', {
        item,
        userTranslation,
        feedback: analysis,
        timestamp: historyId,
      });
    } catch (err: any) {
      setError(`分析时发生错误：${err?.message || '未知错误'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSave = () => {
    if (!feedback || isSaved) return;
    saveToErrorBook(feedback, false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !showOriginal) {
      event.preventDefault();
      handleSubmit();
    }
  };

  if (!item) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 pb-32 md:p-10">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/corpus')}
          className="flex items-center gap-2 text-text-muted transition-colors hover:text-text-main"
        >
          <ArrowLeft className="h-4 w-4" /> 返回主题列表
        </button>
        <div className="rounded-full border border-border bg-surface px-3 py-1 text-sm font-medium text-text-muted">
          回译训练模式
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-danger/20 bg-danger/10 p-4 text-danger">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col rounded-2xl border border-border bg-surface p-6 md:p-8">
          <div className="mb-6 flex items-center gap-2">
            <div className="rounded-lg bg-primary/20 p-2 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold">中文原文 (Source)</h2>
          </div>

          <div className="flex-1 rounded-xl border border-border bg-background p-6">
            <p className="whitespace-pre-wrap text-lg font-medium leading-relaxed">{item.chinese}</p>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-primary/10 bg-primary/5 p-4 text-sm text-text-muted">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p>先完整输出你的英文表达，再对照原文复盘。AI 后端不可用时，系统会自动给出本地基础诊断。</p>
          </div>
        </div>

        <div className="relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface p-6 md:p-8">
          <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl"></div>

          <div className="relative z-10 mb-6 flex items-center gap-2">
            <div className="rounded-lg bg-blue-500/20 p-2 text-blue-400">
              <Edit3 className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold">你的翻译 (Target)</h2>
          </div>

          <div className="relative z-10 flex flex-1 flex-col">
            <textarea
              ref={textareaRef}
              value={userTranslation}
              onChange={(event) => setUserTranslation(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={showOriginal}
              placeholder="在此输入你的英文翻译..."
              className="min-h-[220px] flex-1 resize-none rounded-xl border border-border bg-background p-6 text-lg leading-relaxed outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
              autoFocus
            />

            <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
              <span>Enter 换行 / Ctrl + Enter 提交</span>
              <span>{userTranslation.length} 字符</span>
            </div>

            {!showOriginal && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={!userTranslation.trim() || isSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-bold text-background shadow-[0_0_20px_rgba(0,216,255,0.2)] transition-all hover:bg-primary-hover disabled:border disabled:border-border disabled:bg-surface disabled:text-text-muted disabled:shadow-none"
                >
                  <span>提交</span>
                  <Send className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showOriginal && (
          <motion.div
            ref={resultRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 border-t border-border/50 pt-8"
          >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="relative overflow-hidden rounded-2xl border border-success/30 bg-surface p-6 md:p-8">
                <div className="absolute right-0 top-0 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full bg-success/10 blur-2xl"></div>
                <div className="relative z-10 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <h3 className="font-bold text-success">地道原文 (Original)</h3>
                </div>
                <p className="relative z-10 whitespace-pre-wrap text-xl font-medium leading-relaxed">{item.english}</p>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-surface p-6 shadow-[0_0_30px_rgba(0,216,255,0.05)] md:p-8">
                <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl"></div>

                <div className="relative z-10 mb-8 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-primary/20 p-2 text-primary">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-bold">深度分析</h2>
                  </div>

                  {feedback && (
                    <button
                      onClick={handleManualSave}
                      className={`rounded-lg border p-2 transition-colors ${
                        isSaved
                          ? 'border-purple-500/30 bg-purple-500/10 text-purple-400'
                          : 'border-border bg-surface text-text-muted hover:text-purple-400'
                      }`}
                      title={isSaved ? '已加入错题本' : '加入错题本'}
                    >
                      <BookMarked className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {isSubmitting && !feedback ? (
                  <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                    <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
                    <p className="animate-pulse">正在分析你的翻译...</p>
                  </div>
                ) : (
                  feedback && <FeedbackPanel feedback={feedback} />
                )}
              </div>
            </div>

            {feedback && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center pt-8">
                <Link
                  to="/corpus"
                  className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-bold text-background shadow-[0_0_20px_rgba(0,216,255,0.2)] transition-all hover:scale-105 hover:bg-primary-hover"
                >
                  <RefreshCcw className="h-5 w-5" />
                  <span>继续下一篇</span>
                </Link>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
