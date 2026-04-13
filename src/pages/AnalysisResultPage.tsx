import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Markdown from 'react-markdown';
import { ArrowLeft, CheckCircle2, Sparkles, RefreshCcw, BookMarked, Share2 } from 'lucide-react';
import { corpus, CorpusItem } from '../data/corpus';

interface AnalysisData {
  item: CorpusItem;
  userTranslation: string;
  feedback: string;
}

export default function AnalysisResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<AnalysisData | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const allHistory = JSON.parse(localStorage.getItem('practiceHistory') || '[]');
    // Try to find by history record ID (timestamp)
    const historyItem = allHistory.find((h: any) => String(h.id) === id);

    if (historyItem && historyItem.item && historyItem.feedback) {
      setData({
        item: historyItem.item,
        userTranslation: historyItem.userTranslation,
        feedback: historyItem.feedback
      });
    } else {
      // Fallback 1: Check lastAnalysisResult (for immediate view after practice)
      const savedData = localStorage.getItem('lastAnalysisResult');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          // Match by corpus item ID or history timestamp
          if (parsed.item.id === id || String(parsed.timestamp) === id) {
            setData(parsed);
            return;
          }
        } catch (e) {
          console.error('Error parsing lastAnalysisResult:', e);
        }
      }

      // Fallback 2: If it's an old history item without full data, try to find the corpus item
      if (historyItem) {
        const corpusItem = corpus.find(c => c.id === historyItem.corpusId || c.chinese.includes(historyItem.title.replace('...', '')));
        if (corpusItem) {
          setData({
            item: corpusItem,
            userTranslation: historyItem.userTranslation || '（旧记录暂无翻译备份）',
            feedback: historyItem.feedback || '（旧记录暂无分析备份）'
          });
          return;
        }
      }

      // Fallback 3: If id is a corpus item ID, show it with empty user data
      const directCorpusItem = corpus.find(c => c.id === id);
      if (directCorpusItem) {
        setData({
          item: directCorpusItem,
          userTranslation: '',
          feedback: ''
        });
        return;
      }

      // If all fails, go back
      navigate('/corpus');
    }
  }, [id, navigate]);

  const handleSaveToErrorBook = () => {
    if (!data || isSaved) return;
    
    const saved = localStorage.getItem('errorBook');
    const errorItems = saved ? JSON.parse(saved) : [];
    
    const newItem = {
      id: Date.now(),
      type: 'translation',
      source: data.item.chinese,
      user: data.userTranslation,
      correction: data.item.english,
      note: data.feedback.substring(0, 200) + '...', // Simplified note
      date: new Date().toISOString().split('T')[0]
    };
    
    errorItems.unshift(newItem);
    localStorage.setItem('errorBook', JSON.stringify(errorItems));
    setIsSaved(true);
  };

  if (!data) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/corpus')}
          className="flex items-center gap-2 text-text-muted hover:text-text-main transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> 返回语料库
        </button>
        <div className="flex items-center gap-3">
          <button className="p-2 text-text-muted hover:text-primary bg-surface border border-border rounded-lg transition-colors" title="分享">
            <Share2 className="w-4 h-4" />
          </button>
          <button 
            onClick={handleSaveToErrorBook}
            className={`p-2 rounded-lg transition-colors border ${isSaved ? 'text-purple-400 bg-purple-500/10 border-purple-500/30' : 'text-text-muted hover:text-purple-400 bg-surface border-border'}`} 
            title={isSaved ? "已加入错题本" : "加入错题本"}
          >
            <BookMarked className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Texts */}
        <div className="space-y-6">
          {/* Original English */}
          <div className="bg-surface border border-success/30 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="flex items-center gap-2 mb-4 relative z-10">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <h3 className="font-bold text-success">地道原文 (Original)</h3>
            </div>
            <p className="text-lg font-medium relative z-10 whitespace-pre-wrap">
              {data.item.english}
            </p>
          </div>

          {/* User Translation */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4 text-text-muted">
              <h3 className="font-bold text-sm">你的翻译 (Your Translation)</h3>
            </div>
            <p className="text-lg whitespace-pre-wrap">
              {data.userTranslation}
            </p>
          </div>

          {/* Source Chinese */}
          <div className="bg-background border border-border rounded-2xl p-6 opacity-70">
            <div className="flex items-center gap-2 mb-2 text-text-muted">
              <h3 className="font-bold text-xs uppercase tracking-wider">中文参考</h3>
            </div>
            <p className="text-sm whitespace-pre-wrap">
              {data.item.chinese}
            </p>
          </div>
        </div>

        {/* Right Column: AI Feedback */}
        <div className="bg-surface border border-primary/30 rounded-2xl p-6 md:p-8 shadow-[0_0_30px_rgba(0,216,255,0.05)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          <div className="flex items-center gap-2 mb-8 relative z-10">
            <div className="bg-primary/20 p-2 rounded-lg text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">AI 深度解析</h2>
          </div>
          
          <div className="prose prose-invert prose-p:text-text-main prose-headings:text-text-main prose-a:text-primary hover:prose-a:text-primary-hover prose-strong:text-primary prose-code:text-pink-400 prose-code:bg-pink-400/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none max-w-none relative z-10">
            <Markdown>{data.feedback}</Markdown>
          </div>
        </div>
      </div>

      {/* Next Action */}
      <div className="flex justify-center pt-8 border-t border-border/50">
        <Link
          to="/corpus"
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-background px-8 py-3.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(0,216,255,0.2)] hover:scale-105"
        >
          <RefreshCcw className="w-5 h-5" />
          <span>继续下一篇</span>
        </Link>
      </div>
    </div>
  );
}
