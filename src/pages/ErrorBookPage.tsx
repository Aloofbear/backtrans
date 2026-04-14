import { useState, useEffect } from 'react';
import { BookMarked, Search, Trash2, ChevronDown, ChevronUp, BookOpen, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ErrorBookPage() {
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [errorItems, setErrorItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const errorBookKey = user ? `errorBook_${user}` : 'errorBook_guest';
    const saved = localStorage.getItem(errorBookKey);
    if (saved) {
      try {
        setErrorItems(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, [user]);

  const handleDelete = (id: number) => {
    const errorBookKey = user ? `errorBook_${user}` : 'errorBook_guest';
    const newItems = errorItems.filter(item => item.id !== id);
    setErrorItems(newItems);
    localStorage.setItem(errorBookKey, JSON.stringify(newItems));
  };

  const filteredItems = errorItems.filter(item => 
    (item.corpusTitle && item.corpusTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.expressions && item.expressions.some((exp: any) => 
      exp.english.toLowerCase().includes(searchQuery.toLowerCase()) || 
      exp.chinese.toLowerCase().includes(searchQuery.toLowerCase())
    ))
  );

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400">
              <BookMarked className="w-6 h-6" />
            </div>
            错题本与新表达
          </h1>
          <p className="text-text-muted">自动记录回译训练中的重要表达与生词，助你积累地道英语。</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input 
          type="text" 
          placeholder="搜索篇章、生词或释义..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
        />
      </div>

      {/* Error List */}
      <div className="space-y-6">
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-surface border border-border rounded-2xl">
            <BookMarked className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">错题本空空如也</h3>
            <p className="text-text-muted">完成回译训练后，AI 提取的重要表达会自动记录在这里。</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="bg-surface border border-border rounded-2xl overflow-hidden transition-all">
              {/* Item Header (Clickable) */}
              <div 
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-surface-hover transition-colors"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-purple-500/10 p-2 rounded-lg text-purple-400">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-lg block">{item.corpusTitle || '未命名篇章'}</span>
                    <span className="text-xs text-text-muted">{item.date} · 包含 {item.expressions?.length || 0} 个表达</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-text-muted">
                  {expandedId === item.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === item.id && (
                <div className="p-6 pt-0 border-t border-border/50 bg-background/30">
                  <div className="mt-6 space-y-3">
                    {item.expressions && item.expressions.length > 0 ? (
                      item.expressions.map((exp: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-4 p-4 bg-surface border border-border rounded-xl group hover:border-purple-500/30 transition-colors">
                          <div className="w-6 h-6 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div className="font-bold text-primary text-lg">{exp.english}</div>
                            <div className="text-text-main md:text-right font-medium">{exp.chinese}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-4 text-text-muted italic">暂无提取的表达</p>
                    )}
                  </div>

                  <div className="mt-6 flex justify-between items-center">
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="flex items-center gap-2 text-sm text-text-muted hover:text-danger transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> 移除该篇章记录
                    </button>
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
