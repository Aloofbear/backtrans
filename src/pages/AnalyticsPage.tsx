import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Activity, BarChart3, Clock, Database, GitBranch, Layers3, RefreshCcw, TrendingUp, Users } from 'lucide-react';
import { fetchAnalyticsSummary } from '../lib/analytics';
import { useAuth } from '../contexts/AuthContext';

const ADMIN_TOKEN_STORAGE_KEY = 'backtransAnalyticsAdminToken';

type DailyPoint = {
  date: string;
  events: number;
  sessions: number;
  visitors?: number;
  identifiedUsers?: number;
  submits: number;
  pageViews?: number;
  practiceStarts?: number;
  translationSubmits?: number;
  reviewSubmits?: number;
  aiSuccess?: number;
  aiFailed?: number;
  feedbackExpands?: number;
  favorites?: number;
  shortSentenceSubmits?: number;
  errorBookReviews?: number;
  averageLatencyMs?: number;
  startRate?: number;
  submitRate?: number;
  aiSuccessRate?: number;
  eventCounts?: Record<string, number>;
};

type FunnelStage = {
  key: string;
  label: string;
  sessions: number;
  conversionRate: number;
  dropoffSessions: number;
  dropoffRate: number;
  shareOfEntrance: number;
};

type FunnelRelation = {
  from: string;
  to: string;
  label: string;
  fromSessions: number;
  toSessions: number;
  linkedSessions: number;
  conversionRate: number;
};

type BreakdownRow = {
  source?: string;
  path?: string;
  events: number;
  sessions: number;
  visitors?: number;
  submits: number;
  aiSuccess?: number;
  submitRate?: number;
  aiSuccessRate?: number;
};

type AnalyticsSummary = {
  generatedAt: string;
  days: number;
  totals: {
    events: number;
    sessions: number;
    visitors: number;
    identifiedUsers: number;
    submissions?: number;
    practiceStarts?: number;
    feedbackExpands?: number;
    favorites?: number;
  };
  accounts?: {
    users: number;
    admins: number;
    activeSessions: number;
    syncedProfiles: number;
  };
  funnel: Record<string, any> & {
    stages?: FunnelStage[];
    relations?: FunnelRelation[];
  };
  ai: {
    success: number;
    failed: number;
    requests?: number;
    failureRate?: number;
    averageLatencyMs: number;
  };
  countByEvent: Record<string, number>;
  daily: DailyPoint[];
  hourly?: Array<{ hour: number; events: number; sessions: number; submits: number; aiSuccess: number }>;
  sourceBreakdown?: BreakdownRow[];
  topPaths?: BreakdownRow[];
  topCorpus: Array<{ corpusId: string; count: number; submissions: number; feedbackSuccess: number }>;
};

type MetricKey = keyof Pick<DailyPoint, 'events' | 'sessions' | 'submits' | 'aiSuccess' | 'feedbackExpands' | 'identifiedUsers' | 'averageLatencyMs'>;

const trendSeries = [
  { key: 'sessions' as MetricKey, label: '会话', color: '#3b82f6' },
  { key: 'submits' as MetricKey, label: '提交', color: '#22c55e' },
  { key: 'aiSuccess' as MetricKey, label: 'AI 成功', color: '#a855f7' },
  { key: 'feedbackExpands' as MetricKey, label: '展开详情', color: '#f59e0b' },
];

const compositionSeries = [
  { key: 'pageViews' as keyof DailyPoint, label: '访问', color: '#64748b' },
  { key: 'practiceStarts' as keyof DailyPoint, label: '开始', color: '#3b82f6' },
  { key: 'translationSubmits' as keyof DailyPoint, label: '提交', color: '#22c55e' },
  { key: 'aiSuccess' as keyof DailyPoint, label: 'AI 成功', color: '#a855f7' },
  { key: 'feedbackExpands' as keyof DailyPoint, label: '展开', color: '#f59e0b' },
  { key: 'favorites' as keyof DailyPoint, label: '收藏', color: '#ef4444' },
];

function formatNumber(value: unknown) {
  return Number(value || 0).toLocaleString('zh-CN');
}

function formatPercent(value: unknown) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function formatMs(value: number) {
  if (!value) return '0ms';
  if (value < 1000) return `${value}ms`;
  return `${(value / 1000).toFixed(1)}s`;
}

function getPointValue(point: DailyPoint, key: MetricKey | keyof DailyPoint) {
  const value = point[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function sumMetric(points: DailyPoint[], key: MetricKey) {
  return points.reduce((sum, point) => sum + getPointValue(point, key), 0);
}

function averageMetric(points: DailyPoint[], key: MetricKey) {
  const values = points.map(point => getPointValue(point, key)).filter(Boolean);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function splitDelta(points: DailyPoint[], key: MetricKey, mode: 'sum' | 'avg' = 'sum') {
  if (points.length < 2) return 0;
  const splitIndex = Math.max(1, Math.floor(points.length / 2));
  const previous = points.slice(0, splitIndex);
  const current = points.slice(splitIndex);
  const previousValue = mode === 'avg' ? averageMetric(previous, key) : sumMetric(previous, key);
  const currentValue = mode === 'avg' ? averageMetric(current, key) : sumMetric(current, key);
  if (!previousValue) return currentValue ? 100 : 0;
  return Math.round(((currentValue - previousValue) / previousValue) * 1000) / 10;
}

function buildLinePath(points: DailyPoint[], key: MetricKey, width: number, height: number, maxValue: number) {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const y = height - (getPointValue(points[0], key) / maxValue) * height;
    return `M 0 ${y} L ${width} ${y}`;
  }
  return points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - (getPointValue(point, key) / maxValue) * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

function Sparkline({ points, metric, color }: { points: DailyPoint[]; metric: MetricKey; color: string }) {
  const maxValue = Math.max(1, ...points.map(point => getPointValue(point, metric)));
  const path = buildLinePath(points, metric, 120, 34, maxValue);
  return (
    <svg viewBox="0 0 120 34" className="h-9 w-full" role="img" aria-label="趋势缩略图">
      <path d="M 0 33.5 L 120 33.5" stroke="currentColor" className="text-border" strokeWidth="1" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatCard({
  label,
  value,
  helper,
  icon,
  delta,
  trend,
  color,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: ReactNode;
  delta: number;
  trend: { points: DailyPoint[]; metric: MetricKey };
  color: string;
}) {
  const positive = delta >= 0;
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-text-muted">{label}</div>
          <div className="mt-2 text-2xl font-bold">{value}</div>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background" style={{ color }}>
          {icon}
        </div>
      </div>
      <div className="mt-3">
        <Sparkline points={trend.points} metric={trend.metric} color={color} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        <span className="truncate text-text-muted">{helper}</span>
        <span className={positive ? 'font-bold text-success' : 'font-bold text-danger'}>
          {positive ? '+' : ''}{delta.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

function TrendChart({ points }: { points: DailyPoint[] }) {
  const chartWidth = 760;
  const chartHeight = 260;
  const plotHeight = 190;
  const maxValue = Math.max(1, ...points.flatMap(point => trendSeries.map(series => getPointValue(point, series.key))));
  const yTicks = [1, 0.75, 0.5, 0.25, 0];

  return (
    <section className="rounded-lg border border-border bg-surface p-5">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h2 className="font-bold">核心指标趋势</h2>
          <p className="mt-1 text-sm text-text-muted">同一时间轴对齐会话、提交、AI 成功与展开行为。</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          {trendSeries.map(series => (
            <div key={series.key} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.color }} />
              <span className="text-text-muted">{series.label}</span>
            </div>
          ))}
        </div>
      </div>

      {points.length === 0 ? (
        <EmptyState label="暂无趋势数据" />
      ) : (
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="min-w-[720px]">
            <g transform="translate(44 18)">
              {yTicks.map(tick => {
                const y = (1 - tick) * plotHeight;
                return (
                  <g key={tick}>
                    <line x1="0" x2="680" y1={y} y2={y} stroke="currentColor" className="text-border" strokeDasharray={tick === 0 ? '0' : '4 6'} />
                    <text x="-12" y={y + 4} textAnchor="end" className="fill-text-muted text-[10px]">{Math.round(maxValue * tick)}</text>
                  </g>
                );
              })}
              {trendSeries.map(series => (
                <path
                  key={series.key}
                  d={buildLinePath(points, series.key, 680, plotHeight, maxValue)}
                  fill="none"
                  stroke={series.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
              {points.map((point, index) => {
                const x = points.length === 1 ? 340 : (index / (points.length - 1)) * 680;
                const showLabel = points.length <= 14 || index === 0 || index === points.length - 1 || index % Math.ceil(points.length / 8) === 0;
                return (
                  <g key={point.date}>
                    <line x1={x} x2={x} y1="0" y2={plotHeight} stroke="transparent">
                      <title>{`${point.date} | 会话 ${point.sessions} | 提交 ${point.submits} | AI 成功 ${point.aiSuccess || 0}`}</title>
                    </line>
                    {showLabel && <text x={x} y={plotHeight + 28} textAnchor="middle" className="fill-text-muted text-[10px]">{point.date.slice(5)}</text>}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      )}
    </section>
  );
}

function FunnelFlow({ summary }: { summary: AnalyticsSummary }) {
  const stages = summary.funnel.stages?.length
    ? summary.funnel.stages
    : [
      { key: 'page_view', label: '页面访问', sessions: summary.funnel.pageViewSessions || 0, conversionRate: 100, dropoffSessions: 0, dropoffRate: 0, shareOfEntrance: 100 },
      { key: 'practice_start', label: '开始训练', sessions: summary.funnel.practiceStartSessions || 0, conversionRate: summary.funnel.startRate || 0, dropoffSessions: 0, dropoffRate: 0, shareOfEntrance: summary.funnel.startRate || 0 },
      { key: 'translation_submit', label: '提交译文', sessions: summary.funnel.submitSessions || 0, conversionRate: summary.funnel.submitRate || 0, dropoffSessions: 0, dropoffRate: 0, shareOfEntrance: 0 },
      { key: 'ai_feedback_success', label: 'AI 成功', sessions: summary.funnel.aiSuccessSessions || 0, conversionRate: summary.funnel.aiSuccessRate || 0, dropoffSessions: 0, dropoffRate: 0, shareOfEntrance: 0 },
    ];
  const maxSessions = Math.max(1, stages[0]?.sessions || 0, ...stages.map(stage => stage.sessions));

  return (
    <section className="rounded-lg border border-border bg-surface p-5">
      <div className="mb-5 flex items-center gap-2 font-bold">
        <GitBranch className="h-5 w-5 text-primary" />
        转化漏斗与流失
      </div>
      <div className="grid gap-3 lg:grid-cols-6">
        {stages.map((stage, index) => (
          <div key={stage.key} className="rounded-lg border border-border bg-background p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-text-muted">{stage.label}</span>
              <span className="text-[10px] text-text-muted">#{index + 1}</span>
            </div>
            <div className="mt-2 text-2xl font-bold">{formatNumber(stage.sessions)}</div>
            <div className="mt-3 h-2 rounded-full bg-surface">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${Math.max(4, (stage.sessions / maxSessions) * 100)}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <div className="text-text-muted">承接</div>
                <div className="font-bold">{formatPercent(stage.conversionRate)}</div>
              </div>
              <div>
                <div className="text-text-muted">流失</div>
                <div className="font-bold text-danger">{formatNumber(stage.dropoffSessions)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {(summary.funnel.relations || []).map(relation => (
          <div key={`${relation.from}-${relation.to}`} className="rounded-lg border border-border bg-background p-3">
            <div className="truncate text-xs text-text-muted">{relation.label}</div>
            <div className="mt-2 flex items-end justify-between gap-3">
              <div className="text-xl font-bold">{formatPercent(relation.conversionRate)}</div>
              <div className="text-xs text-text-muted">{formatNumber(relation.linkedSessions)} / {formatNumber(relation.fromSessions)}</div>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-surface">
              <div className="h-1.5 rounded-full bg-success" style={{ width: `${Math.min(100, Math.max(2, relation.conversionRate))}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DailyComposition({ points }: { points: DailyPoint[] }) {
  const maxTotal = Math.max(1, ...points.map(point => compositionSeries.reduce((sum, series) => sum + getPointValue(point, series.key), 0)));

  return (
    <section className="rounded-lg border border-border bg-surface p-5">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h2 className="font-bold">每日行为结构</h2>
          <p className="mt-1 text-sm text-text-muted">看每天的访问、开始、提交、AI、展开、收藏之间的占比变化。</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          {compositionSeries.map(series => (
            <div key={series.key} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.color }} />
              <span className="text-text-muted">{series.label}</span>
            </div>
          ))}
        </div>
      </div>
      {points.length === 0 ? (
        <EmptyState label="暂无结构数据" />
      ) : (
        <div className="flex h-64 items-end gap-2 overflow-x-auto pb-1">
          {points.map(point => {
            const total = compositionSeries.reduce((sum, series) => sum + getPointValue(point, series.key), 0);
            return (
              <div key={point.date} className="flex min-w-8 flex-1 flex-col items-center gap-2">
                <div className="flex h-48 w-full min-w-7 items-end rounded bg-background px-1">
                  <div className="flex w-full flex-col justify-end overflow-hidden rounded-sm" style={{ height: `${Math.max(4, (total / maxTotal) * 100)}%` }}>
                    {compositionSeries.map(series => {
                      const value = getPointValue(point, series.key);
                      if (!value) return null;
                      return (
                        <div
                          key={series.key}
                          style={{ height: `${Math.max(5, (value / Math.max(1, total)) * 100)}%`, backgroundColor: series.color }}
                          title={`${point.date} ${series.label}: ${value}`}
                        />
                      );
                    })}
                  </div>
                </div>
                <div className="whitespace-nowrap text-[10px] text-text-muted">{point.date.slice(5)}</div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function HourlyHeatmap({ summary }: { summary: AnalyticsSummary }) {
  const rows = summary.hourly || [];
  const maxEvents = Math.max(1, ...rows.map(row => row.events));

  return (
    <section className="rounded-lg border border-border bg-surface p-5">
      <div className="mb-5 flex items-center gap-2 font-bold">
        <Clock className="h-5 w-5 text-primary" />
        时段热力
      </div>
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 lg:grid-cols-12">
        {Array.from({ length: 24 }, (_, hour) => {
          const row = rows.find(item => item.hour === hour) || { hour, events: 0, sessions: 0, submits: 0, aiSuccess: 0 };
          const intensity = row.events / maxEvents;
          const background = `rgba(59, 130, 246, ${0.08 + intensity * 0.72})`;
          return (
            <div key={hour} className="rounded-lg border border-border p-2" style={{ background }}>
              <div className="text-[10px] text-text-muted">{String(hour).padStart(2, '0')}:00</div>
              <div className="mt-1 text-lg font-bold">{formatNumber(row.events)}</div>
              <div className="text-[10px] text-text-muted">提交 {formatNumber(row.submits)}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function EventMix({ summary }: { summary: AnalyticsSummary }) {
  const rows = Object.entries(summary.countByEvent || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);
  const maxCount = Math.max(1, ...rows.map(([, count]) => count));

  return (
    <section className="rounded-lg border border-border bg-surface p-5">
      <div className="mb-5 flex items-center gap-2 font-bold">
        <Layers3 className="h-5 w-5 text-primary" />
        事件结构
      </div>
      <div className="space-y-3">
        {rows.map(([event, count]) => (
          <div key={event}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="truncate">{event}</span>
              <span className="font-bold text-primary">{formatNumber(count)}</span>
            </div>
            <div className="h-2 rounded-full bg-background">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(2, (count / maxCount) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BreakdownTable({ title, rows, nameKey }: { title: string; rows: BreakdownRow[]; nameKey: 'source' | 'path' }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5">
      <div className="mb-5 font-bold">{title}</div>
      {rows.length === 0 ? (
        <EmptyState label="暂无数据" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-text-muted">
              <tr>
                <th className="py-2">{nameKey === 'source' ? '来源' : '路径'}</th>
                <th className="py-2">会话</th>
                <th className="py-2">提交</th>
                <th className="py-2">提交率</th>
                <th className="py-2">事件</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={String(row[nameKey])} className="border-t border-border">
                  <td className="max-w-[260px] truncate py-3 font-bold">{row[nameKey]}</td>
                  <td className="py-3">{formatNumber(row.sessions)}</td>
                  <td className="py-3">{formatNumber(row.submits)}</td>
                  <td className="py-3">{formatPercent(row.submitRate)}</td>
                  <td className="py-3">{formatNumber(row.events)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function TopCorpusTable({ summary }: { summary: AnalyticsSummary }) {
  const maxSubmits = Math.max(1, ...summary.topCorpus.map(item => item.submissions));

  return (
    <section className="rounded-lg border border-border bg-surface p-5">
      <div className="mb-5 font-bold">语料贡献排行</div>
      {summary.topCorpus.length === 0 ? (
        <EmptyState label="暂无语料提交数据" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="text-text-muted">
              <tr>
                <th className="py-2">语料 ID</th>
                <th className="py-2">提交次数</th>
                <th className="py-2">AI 成功</th>
                <th className="py-2">成功/提交</th>
                <th className="py-2">贡献强度</th>
              </tr>
            </thead>
            <tbody>
              {summary.topCorpus.map(item => (
                <tr key={item.corpusId} className="border-t border-border">
                  <td className="py-3 font-bold">{item.corpusId}</td>
                  <td className="py-3">{formatNumber(item.submissions)}</td>
                  <td className="py-3">{formatNumber(item.feedbackSuccess)}</td>
                  <td className="py-3">{formatPercent((item.feedbackSuccess / Math.max(1, item.submissions)) * 100)}</td>
                  <td className="py-3">
                    <div className="h-2 rounded-full bg-background">
                      <div className="h-2 rounded-full bg-success" style={{ width: `${Math.max(3, (item.submissions / maxSubmits) * 100)}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-lg border border-border bg-background p-8 text-center text-sm text-text-muted">
      {label}
    </div>
  );
}

export default function AnalyticsPage() {
  const { role } = useAuth();
  const [days, setDays] = useState(30);
  const [adminToken, setAdminToken] = useState(() => window.sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || '');
  const [tokenInput, setTokenInput] = useState('');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(adminToken || role === 'admin'));
  const [error, setError] = useState('');
  const hasAdminAccess = role === 'admin' || Boolean(adminToken);

  const loadSummary = async () => {
    if (!hasAdminAccess) return;
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
  }, [adminToken, days, role]);

  const metricCards = useMemo(() => {
    const points = summary?.daily || [];
    return [
      {
        label: '事件总量',
        value: formatNumber(summary?.totals.events),
        helper: `近 ${days} 天行为触发`,
        icon: <Activity className="h-5 w-5" />,
        delta: splitDelta(points, 'events'),
        trend: { points, metric: 'events' as MetricKey },
        color: '#3b82f6',
      },
      {
        label: '访问会话',
        value: formatNumber(summary?.totals.sessions),
        helper: `${formatNumber(summary?.totals.visitors)} 个访客`,
        icon: <Users className="h-5 w-5" />,
        delta: splitDelta(points, 'sessions'),
        trend: { points, metric: 'sessions' as MetricKey },
        color: '#22c55e',
      },
      {
        label: '训练提交',
        value: formatNumber(summary?.totals.submissions ?? (summary?.funnel.submitSessions || 0) + (summary?.funnel.reviewSubmitSessions || 0)),
        helper: `提交率 ${formatPercent(summary?.funnel.submitRate)}`,
        icon: <TrendingUp className="h-5 w-5" />,
        delta: splitDelta(points, 'submits'),
        trend: { points, metric: 'submits' as MetricKey },
        color: '#f59e0b',
      },
      {
        label: 'AI 成功',
        value: formatNumber(summary?.ai.success),
        helper: `失败率 ${formatPercent(summary?.ai.failureRate)}`,
        icon: <BarChart3 className="h-5 w-5" />,
        delta: splitDelta(points, 'aiSuccess'),
        trend: { points, metric: 'aiSuccess' as MetricKey },
        color: '#a855f7',
      },
      {
        label: '云端用户',
        value: formatNumber(summary?.accounts?.users ?? summary?.totals.identifiedUsers),
        helper: `${formatNumber(summary?.accounts?.syncedProfiles)} 份云端记录`,
        icon: <Database className="h-5 w-5" />,
        delta: splitDelta(points, 'identifiedUsers'),
        trend: { points, metric: 'identifiedUsers' as MetricKey },
        color: '#06b6d4',
      },
      {
        label: 'AI 平均耗时',
        value: formatMs(summary?.ai.averageLatencyMs || 0),
        helper: `${formatNumber(summary?.ai.requests)} 次 AI 请求`,
        icon: <Clock className="h-5 w-5" />,
        delta: splitDelta(points, 'averageLatencyMs', 'avg'),
        trend: { points, metric: 'averageLatencyMs' as MetricKey },
        color: '#ef4444',
      },
    ];
  }, [summary, days]);

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

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 pb-32 sm:p-6 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold">
            <div className="rounded-lg bg-primary/20 p-2 text-primary">
              <BarChart3 className="h-6 w-6" />
            </div>
            产品数据看板
          </h1>
          <p className="text-sm text-text-muted">训练漏斗、时间趋势、行为结构、来源贡献与语料表现。</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {summary && <span className="text-xs text-text-muted">更新：{new Date(summary.generatedAt).toLocaleString('zh-CN')}</span>}
          <select
            value={days}
            onChange={event => setDays(Number(event.target.value))}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary/50"
          >
            <option value={7}>近 7 天</option>
            <option value={30}>近 30 天</option>
            <option value={90}>近 90 天</option>
          </select>
          <button
            onClick={loadSummary}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-bold transition-colors hover:border-primary/50 disabled:opacity-60"
          >
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger/10 p-4 text-sm text-danger">
          {error}
        </div>
      )}

      {!hasAdminAccess ? (
        <form onSubmit={handleUnlock} className="mx-auto max-w-md rounded-lg border border-border bg-surface p-6">
          <div className="mb-4 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary">
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
            className="w-full rounded-lg border border-border bg-background px-4 py-3 outline-none transition-colors focus:border-primary/50"
            autoFocus
          />
          <button
            type="submit"
            className="mt-4 w-full rounded-lg bg-primary px-4 py-3 font-bold text-background transition-colors hover:bg-primary-hover"
          >
            查看数据看板
          </button>
        </form>
      ) : isLoading && !summary ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center text-text-muted">
          正在加载数据...
        </div>
      ) : summary && (
        <>
          <div className="flex justify-end">
            {adminToken && (
              <button
                type="button"
                onClick={handleLock}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-bold text-text-muted transition-colors hover:text-danger"
              >
                退出管理员看板
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metricCards.map(card => <StatCard key={card.label} {...card} />)}
          </div>

          <TrendChart points={summary.daily || []} />
          <FunnelFlow summary={summary} />

          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <DailyComposition points={summary.daily || []} />
            <EventMix summary={summary} />
          </div>

          <HourlyHeatmap summary={summary} />

          <div className="grid gap-6 xl:grid-cols-2">
            <BreakdownTable title="来源贡献" rows={summary.sourceBreakdown || []} nameKey="source" />
            <BreakdownTable title="高价值路径" rows={summary.topPaths || []} nameKey="path" />
          </div>

          <TopCorpusTable summary={summary} />
        </>
      )}
    </div>
  );
}
