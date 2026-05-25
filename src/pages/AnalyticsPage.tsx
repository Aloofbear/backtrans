import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Activity, BarChart3, Clock, RefreshCcw, TrendingUp, Users } from 'lucide-react';
import { fetchAnalyticsSummary } from '../lib/analytics';

const ADMIN_TOKEN_STORAGE_KEY = 'backtransAnalyticsAdminToken';

type AnalyticsSummary = {
  generatedAt: string;
  days: number;
  totals: {
    events: number;
    sessions: number;
    visitors: number;
    identifiedUsers: number;
  };
  funnel: Record<string, number>;
  ai: {
    success: number;
    failed: number;
    averageLatencyMs: number;
  };
  countByEvent: Record<string, number>;
  daily: Array<{ date: string; events: number; sessions: number; submits: number }>;
  topCorpus: Array<{ corpusId: string; count: number; submissions: number; feedbackSuccess: number }>;
};

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between text-text-muted">
        <span className="text-sm">{label}</span>
        {icon}
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}

function formatPercent(value: unknown) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function formatMs(value: number) {
  if (!value) return '0ms';
  if (value < 1000) return `${value}ms`;
  return `${(value / 1000).toFixed(1)}s`;
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [adminToken, setAdminToken] = useState(() => window.sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || '');
  const [tokenInput, setTokenInput] = useState('');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(adminToken));
  const [error, setError] = useState('');

  const loadSummary = async () => {
    if (!adminToken) return;
    setIsLoading(true);
    setError('');
    try {
      setSummary(await fetchAnalyticsSummary(days, adminToken));
    } catch (err: any) {
      if (String(err?.message || '').includes('401')) {
        window.sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
        setAdminToken('');
        setSummary(null);
        setError('访问码不正确或已失效。');
      } else {
        setError(err?.message || '数据加载失败');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [adminToken, days]);

  const handleUnlock = (event: FormEvent) => {
    event.preventDefault();
    const token = tokenInput.trim();
    if (!token) {
      setError('请输入管理员访问码。');
      return;
    }
    window.sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
    setAdminToken(token);
    setTokenInput('');
  };

  const handleLock = () => {
    window.sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    setAdminToken('');
    setSummary(null);
    setError('');
  };

  const maxDailyEvents = Math.max(1, ...(summary?.daily || []).map(item => item.events));
  const eventRows = Object.entries(summary?.countByEvent || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 pb-32 sm:p-6 md:p-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold">
            <div className="rounded-lg bg-primary/20 p-2 text-primary">
              <BarChart3 className="h-6 w-6" />
            </div>
            产品数据看板
          </h1>
          <p className="text-text-muted">访问、训练、提交、AI 分析、展开详情与复习回译的自有埋点数据。</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={event => setDays(Number(event.target.value))}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary/50"
          >
            <option value={7}>近 7 天</option>
            <option value={30}>近 30 天</option>
            <option value={90}>近 90 天</option>
          </select>
          <button
            onClick={loadSummary}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-bold transition-colors hover:border-primary/50 disabled:opacity-60"
          >
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">
          {error}
        </div>
      )}

      {!adminToken ? (
        <form onSubmit={handleUnlock} className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-6">
          <div className="mb-4 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold">管理员访问</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              产品数据只对管理员开放。请输入访问码后查看漏斗与埋点数据。
            </p>
          </div>
          <input
            type="password"
            value={tokenInput}
            onChange={event => setTokenInput(event.target.value)}
            placeholder="输入管理员访问码"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition-colors focus:border-primary/50"
            autoFocus
          />
          <button
            type="submit"
            className="mt-4 w-full rounded-xl bg-primary px-4 py-3 font-bold text-background transition-colors hover:bg-primary-hover"
          >
            查看数据看板
          </button>
        </form>
      ) : isLoading && !summary ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center text-text-muted">
          正在加载数据...
        </div>
      ) : summary && (
        <>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleLock}
              className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-bold text-text-muted transition-colors hover:text-danger"
            >
              退出管理员看板
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="事件总量" value={summary.totals.events} icon={<Activity className="h-5 w-5" />} />
            <StatCard label="访问会话" value={summary.totals.sessions} icon={<Users className="h-5 w-5" />} />
            <StatCard label="识别用户" value={summary.totals.identifiedUsers} icon={<Users className="h-5 w-5" />} />
            <StatCard label="AI 平均耗时" value={formatMs(summary.ai.averageLatencyMs)} icon={<Clock className="h-5 w-5" />} />
          </div>

          <section className="rounded-2xl border border-border bg-surface p-5">
            <div className="mb-5 flex items-center gap-2 font-bold">
              <TrendingUp className="h-5 w-5 text-primary" />
              训练漏斗
            </div>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              {[
                ['页面访问', summary.funnel.pageViewSessions],
                ['开始回译', summary.funnel.practiceStartSessions],
                ['提交译文', summary.funnel.submitSessions],
                ['AI 成功', summary.funnel.aiSuccessSessions],
                ['展开详情', formatPercent(summary.funnel.feedbackExpandRate)],
                ['复习提交', summary.funnel.reviewSubmitSessions],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-border bg-background p-4">
                  <div className="text-xs text-text-muted">{label}</div>
                  <div className="mt-2 text-2xl font-bold">{value}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-3 text-sm text-text-muted md:grid-cols-4">
              <div>开始率：<span className="font-bold text-text-main">{formatPercent(summary.funnel.startRate)}</span></div>
              <div>提交率：<span className="font-bold text-text-main">{formatPercent(summary.funnel.submitRate)}</span></div>
              <div>AI 成功率：<span className="font-bold text-text-main">{formatPercent(summary.funnel.aiSuccessRate)}</span></div>
              <div>收藏率：<span className="font-bold text-text-main">{formatPercent(summary.funnel.favoriteRate)}</span></div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <section className="rounded-2xl border border-border bg-surface p-5">
              <div className="mb-5 font-bold">每日趋势</div>
              <div className="flex h-56 items-end gap-2">
                {summary.daily.length === 0 ? (
                  <div className="flex h-full w-full items-center justify-center text-text-muted">暂无事件</div>
                ) : summary.daily.map(item => (
                  <div key={item.date} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-44 w-full items-end rounded-lg bg-background px-1">
                      <div
                        className="w-full rounded-t-lg bg-primary/70"
                        style={{ height: `${Math.max(4, (item.events / maxDailyEvents) * 100)}%` }}
                        title={`${item.date}: ${item.events} events`}
                      />
                    </div>
                    <div className="text-[10px] text-text-muted">{item.date.slice(5)}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-surface p-5">
              <div className="mb-5 font-bold">事件排行</div>
              <div className="space-y-3">
                {eventRows.map(([event, count]) => (
                  <div key={event} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2">
                    <span className="truncate text-sm">{event}</span>
                    <span className="font-bold text-primary">{count}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="rounded-2xl border border-border bg-surface p-5">
            <div className="mb-5 font-bold">语料提交排行</div>
            {summary.topCorpus.length === 0 ? (
              <div className="rounded-xl border border-border bg-background p-8 text-center text-text-muted">暂无语料提交数据</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="text-text-muted">
                    <tr>
                      <th className="py-2">语料 ID</th>
                      <th className="py-2">提交次数</th>
                      <th className="py-2">AI 成功</th>
                      <th className="py-2">相关事件</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.topCorpus.map(item => (
                      <tr key={item.corpusId} className="border-t border-border">
                        <td className="py-3 font-bold">{item.corpusId}</td>
                        <td className="py-3">{item.submissions}</td>
                        <td className="py-3">{item.feedbackSuccess}</td>
                        <td className="py-3">{item.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
