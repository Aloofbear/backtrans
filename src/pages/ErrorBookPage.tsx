import { useEffect, useState } from 'react';
import { BookMarked, BookOpen, ChevronDown, ChevronUp, Search, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getFutureDateString, getScopedStorageKey, getTodayDateString, readJson, writeJson } from '../lib/storage';
import { trackEvent } from '../lib/analytics';
import type { ErrorBookEntry } from '../types/learning';

function getExpressionText(expression: any) {
  return {
    expression: expression.expression || expression.english || '',
    meaning: expression.meaning || expression.chinese || '',
    reason: expression.reason,
  };
}

export default function ErrorBookPage() {
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [errorItems, setErrorItems] = useState<ErrorBookEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const errorBookKey = getScopedStorageKey('errorBook', user);
    const saved = readJson<ErrorBookEntry[]>(errorBookKey, []);
    setErrorItems(saved.map(item => ({
      ...item,
      dueDate: item.dueDate || item.date || getTodayDateString(),
      timesReviewed: item.timesReviewed || 0,
      status: item.status || 'new',
      expressions: item.expressions || [],
    })));
  }, [user]);

  const persistItems = (items: ErrorBookEntry[]) => {
    const errorBookKey = getScopedStorageKey('errorBook', user);
    setErrorItems(items);
    writeJson(errorBookKey, items);
  };

  const handleDelete = (id: number) => {
    persistItems(errorItems.filter(item => item.id !== id));
  };

  const handleReview = (id: number, mastered = false) => {
    const item = errorItems.find(entry => entry.id === id);
    trackEvent('errorbook_review', {
      entryType: item?.type || 'unknown',
      expressionCount: item?.expressions?.length || 0,
      mastered,
      previousTimesReviewed: item?.timesReviewed || 0,
    }, user);
    persistItems(errorItems.map(item => {
      if (item.id !== id) return item;
      const nextReviewGap = Math.min(14, Math.max(1, (item.timesReviewed || 0) + 1) * 2);
      return {
        ...item,
        timesReviewed: (item.timesReviewed || 0) + 1,
        status: mastered ? ('mastered' as const) : ('reviewing' as const),
        dueDate: mastered ? getFutureDateString(30) : getFutureDateString(nextReviewGap),
      };
    }));
  };

  const today = getTodayDateString();
  const filteredItems = errorItems.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      (item.corpusTitle && item.corpusTitle.toLowerCase().includes(query)) ||
      (item.expressions && item.expressions.some((raw: any) => {
        const expression = getExpressionText(raw);
        return expression.expression.toLowerCase().includes(query) || expression.meaning.toLowerCase().includes(query);
      }))
    );
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold">
            <div className="rounded-lg bg-purple-500/20 p-2 text-purple-400">
              <BookMarked className="h-6 w-6" />
            </div>
            错题本与复习队列
          </h1>
          <p className="text-text-muted">自动记录回译训练中的重要表达，并按复习状态沉淀为长期记忆。</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="搜索篇章、生词或释义..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-4 transition-all focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="text-sm text-text-muted">总表达组</div>
          <div className="mt-1 text-2xl font-bold">{errorItems.length}</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="text-sm text-text-muted">今日待复习</div>
          <div className="mt-1 text-2xl font-bold text-purple-400">
            {errorItems.filter(item => item.status !== 'mastered' && (!item.dueDate || item.dueDate <= today)).length}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="text-sm text-text-muted">已掌握</div>
          <div className="mt-1 text-2xl font-bold text-success">
            {errorItems.filter(item => item.status === 'mastered').length}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface py-20 text-center">
            <BookMarked className="mx-auto mb-4 h-12 w-12 text-text-muted opacity-50" />
            <h3 className="mb-2 text-lg font-medium">错题本空空如也</h3>
            <p className="text-text-muted">完成回译训练后，重要表达会自动记录在这里。</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className="overflow-hidden rounded-2xl border border-border bg-surface transition-all">
              <div
                className="flex cursor-pointer items-center justify-between p-5 transition-colors hover:bg-surface-hover"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-lg font-bold">{item.corpusTitle || '未命名篇章'}</span>
                    <span className="text-xs text-text-muted">
                      {item.date} · 包含 {item.expressions?.length || 0} 个表达 · 复习 {item.timesReviewed || 0} 次
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-text-muted">
                  <span className={`hidden rounded-full border px-2 py-1 text-xs sm:inline ${
                    item.status === 'mastered'
                      ? 'border-success/30 text-success'
                      : item.dueDate <= today
                        ? 'border-purple-500/30 text-purple-400'
                        : 'border-border'
                  }`}>
                    {item.status === 'mastered' ? '已掌握' : item.dueDate <= today ? '待复习' : `下次 ${item.dueDate}`}
                  </span>
                  {expandedId === item.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </div>

              {expandedId === item.id && (
                <div className="border-t border-border/50 bg-background/30 p-6 pt-0">
                  <div className="mt-6 space-y-3">
                    {item.expressions && item.expressions.length > 0 ? (
                      item.expressions.map((raw: any, index: number) => {
                        const expression = getExpressionText(raw);
                        return (
                          <div key={index} className="group flex items-start gap-4 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-purple-500/30">
                            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-xs font-bold text-purple-400">
                              {index + 1}
                            </div>
                            <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-2">
                              <div>
                                <div className="text-lg font-bold text-primary">{expression.expression}</div>
                                {expression.reason && <div className="mt-1 text-xs text-text-muted">{expression.reason}</div>}
                              </div>
                              <div className="font-medium text-text-main md:text-right">{expression.meaning}</div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="py-4 text-center italic text-text-muted">暂无提取的表达</p>
                    )}
                  </div>

                  <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" /> 移除该篇章记录
                    </button>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => handleReview(item.id)}
                        className="text-sm text-text-muted transition-colors hover:text-purple-400"
                      >
                        已复习，稍后再练
                      </button>
                      <button
                        onClick={() => handleReview(item.id, true)}
                        className="text-sm text-success hover:underline"
                      >
                        标记掌握
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
