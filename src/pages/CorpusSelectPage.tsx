import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowRight, AlertCircle, Filter, Timer } from 'lucide-react';
import { corpus, corpusTopics } from '../data/corpus';
import { useAuth } from '../contexts/AuthContext';
import { getScopedStorageKey, readJson } from '../lib/storage';
import { DifficultyFilter, GoalFilter, LengthFilter, getCorpusInsight } from '../lib/learningProduct';
import { trackEvent } from '../lib/analytics';

const difficultyOptions: { value: DifficultyFilter; label: string }[] = [
  { value: 'all', label: '全部难度' },
  { value: 'starter', label: '轻量' },
  { value: 'standard', label: '标准' },
  { value: 'challenge', label: '挑战' },
];

const lengthOptions: { value: LengthFilter; label: string }[] = [
  { value: 'all', label: '全部篇幅' },
  { value: 'micro', label: '1-2 句' },
  { value: 'short', label: '短段' },
  { value: 'long', label: '长段' },
];

const goalOptions: { value: GoalFilter; label: string }[] = [
  { value: 'all', label: '全部重点' },
  { value: 'accuracy', label: '准确传意' },
  { value: 'grammar', label: '句法结构' },
  { value: 'vocabulary', label: '术语词汇' },
  { value: 'naturalness', label: '地道表达' },
];

export default function CorpusSelectPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [topicFilter, setTopicFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('starter');
  const [lengthFilter, setLengthFilter] = useState<LengthFilter>('all');
  const [goalFilter, setGoalFilter] = useState<GoalFilter>('all');

  const completedIds = readJson<string[]>(getScopedStorageKey('completedCorpusIds', user), []);

  const filteredCorpus = useMemo(() => {
    return corpus.filter(item => {
      const insight = getCorpusInsight(item);
      return (
        (topicFilter === 'all' || item.topicId === topicFilter) &&
        (difficultyFilter === 'all' || insight.difficulty === difficultyFilter) &&
        (lengthFilter === 'all' || insight.length === lengthFilter) &&
        (goalFilter === 'all' || insight.goal === goalFilter)
      );
    });
  }, [difficultyFilter, goalFilter, lengthFilter, topicFilter]);

  const handleTopicSelect = (topicId: string) => {
    setError('');
    trackEvent('corpus_topic_select', {
      topicId,
      matchedCount: filteredCorpus.length,
      uncompletedCount: filteredCorpus.filter(item => !completedIds.includes(item.id)).length,
      difficulty: difficultyFilter,
      length: lengthFilter,
      goal: goalFilter,
    }, user);
    
    const topicCorpus = filteredCorpus.filter(c => topicId === 'all' || c.topicId === topicId);
    
    if (topicCorpus.length === 0) {
      setError('当前筛选条件下暂无可训练语料。');
      return;
    }

    const availableCorpus = topicCorpus.filter(c => !completedIds.includes(c.id));

    if (availableCorpus.length === 0) {
      setError('太棒了！您已完成该主题下的所有语料训练。');
      return;
    }

    const randomItem = availableCorpus[Math.floor(Math.random() * availableCorpus.length)];
    navigate(`/practice/${randomItem.id}`);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-lg text-primary">
              <BookOpen className="w-6 h-6" />
            </div>
            回译训练
          </h1>
          <p className="text-text-muted">选择一个主题，系统将为您随机抽取一篇未练习过的语料。</p>
        </div>
        <button
          onClick={() => {
            trackEvent('quick_start_click', {
              matchedCount: filteredCorpus.length,
              uncompletedCount: filteredCorpus.filter(item => !completedIds.includes(item.id)).length,
              difficulty: difficultyFilter,
              length: lengthFilter,
              goal: goalFilter,
            }, user);
            handleTopicSelect('all');
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-background transition-colors hover:bg-primary-hover"
        >
          <Timer className="h-4 w-4" />
          快速开始
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="mb-4 flex items-center gap-2 font-bold">
          <Filter className="h-5 w-5 text-primary" />
          训练筛选
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select value={topicFilter} onChange={event => {
            const value = event.target.value;
            setTopicFilter(value);
            trackEvent('corpus_filter_change', { filter: 'topic', value }, user);
          }} className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary/50">
            <option value="all">全部主题</option>
            {corpusTopics.map(topic => <option key={topic.id} value={topic.id}>{topic.title}</option>)}
          </select>
          <select value={difficultyFilter} onChange={event => {
            const value = event.target.value as DifficultyFilter;
            setDifficultyFilter(value);
            trackEvent('corpus_filter_change', { filter: 'difficulty', value }, user);
          }} className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary/50">
            {difficultyOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select value={lengthFilter} onChange={event => {
            const value = event.target.value as LengthFilter;
            setLengthFilter(value);
            trackEvent('corpus_filter_change', { filter: 'length', value }, user);
          }} className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary/50">
            {lengthOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select value={goalFilter} onChange={event => {
            const value = event.target.value as GoalFilter;
            setGoalFilter(value);
            trackEvent('corpus_filter_change', { filter: 'goal', value }, user);
          }} className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary/50">
            {goalOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        <div className="mt-3 text-xs text-text-muted">
          当前匹配 {filteredCorpus.length} 条语料，未完成 {filteredCorpus.filter(item => !completedIds.includes(item.id)).length} 条。
        </div>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {corpusTopics.map((topic) => {
          const topicItems = filteredCorpus.filter(c => c.topicId === topic.id);
          const totalCount = topicItems.length;
          const completedCount = topicItems.filter(c => completedIds.includes(c.id)).length;
          const fastest = topicItems.map(getCorpusInsight).sort((a, b) => a.estimatedMinutes - b.estimatedMinutes)[0];

          return (
            <button 
              key={topic.id}
              onClick={() => handleTopicSelect(topic.id)}
              disabled={totalCount === 0}
              className="bg-surface border border-border rounded-2xl p-6 hover:border-primary/50 transition-all hover:-translate-y-1 group flex flex-col text-left h-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="text-4xl">
                  {topic.icon}
                </div>
                <span className="text-xs font-medium text-text-muted bg-background px-2.5 py-1 rounded-full border border-border">
                  进度: {completedCount} / {totalCount}
                </span>
              </div>
              
              <h3 className="text-xl font-bold mb-2">{topic.title}</h3>
              <p className="text-sm text-text-muted mb-6 flex-1">
                {topic.description}
              </p>
              <div className="mb-4 flex flex-wrap gap-2 text-xs text-text-muted">
                <span className="rounded-full border border-border bg-background px-2 py-1">{fastest ? `${fastest.estimatedMinutes} 分钟起` : '暂无匹配'}</span>
                <span className="rounded-full border border-border bg-background px-2 py-1">{fastest?.goalLabel || '调整筛选'}</span>
              </div>
              
              <div className="flex items-center text-primary text-sm font-medium mt-auto">
                随机抽取语料 <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
