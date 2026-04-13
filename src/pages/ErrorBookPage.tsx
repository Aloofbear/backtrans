import { useState, useEffect } from 'react';
import { BookMarked, Search, Filter, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export default function ErrorBookPage() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [errorItems, setErrorItems] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('errorBook');
    if (saved) {
      try {
        setErrorItems(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleDelete = (id: number) => {
    const newItems = errorItems.filter(item => item.id !== id);
    setErrorItems(newItems);
    localStorage.setItem('errorBook', JSON.stringify(newItems));
  };

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
          <p className="text-text-muted">复习你的易错点，积累地道表达，温故而知新。</p>
        </div>
        
        <button className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors shadow-[0_0_15px_rgba(168,85,247,0.3)]">
          开始智能复习
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input 
            type="text" 
            placeholder="搜索错题、笔记..." 
            className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <select className="bg-surface border border-border rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-purple-500/50">
            <option>所有类型</option>
            <option>语法错误</option>
            <option>词汇选择</option>
            <option>地道表达</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-3 bg-surface border border-border rounded-xl text-sm font-medium hover:bg-surface-hover transition-colors whitespace-nowrap">
            <Filter className="w-4 h-4" /> 更多筛选
          </button>
        </div>
      </div>

      {/* Error List */}
      <div className="space-y-4">
        {errorItems.length === 0 ? (
          <div className="text-center py-20 bg-surface border border-border rounded-2xl">
            <BookMarked className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">错题本空空如也</h3>
            <p className="text-text-muted">在回译训练或短句训练中遇到困难时，可以将其加入错题本。</p>
          </div>
        ) : (
          errorItems.map((item) => (
            <div key={item.id} className="bg-surface border border-border rounded-2xl overflow-hidden transition-all">
              {/* Item Header (Clickable) */}
              <div 
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-surface-hover transition-colors"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <div className="flex items-center gap-4">
                  <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                    item.type === 'grammar' ? 'bg-blue-500/20 text-blue-400' :
                    item.type === 'vocabulary' ? 'bg-orange-500/20 text-orange-400' :
                    item.type === 'short-sentence' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {item.type}
                  </span>
                  <span className="font-medium line-clamp-1">{item.source}</span>
                </div>
                <div className="flex items-center gap-4 text-text-muted">
                  <span className="text-xs hidden sm:block">{item.date}</span>
                  {expandedId === item.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === item.id && (
                <div className="p-6 pt-0 border-t border-border/50 bg-background/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <div className="text-xs text-text-muted mb-2 uppercase tracking-wider font-bold">你的翻译</div>
                      <div className="p-3 bg-surface border border-border rounded-lg text-sm text-text-muted line-through decoration-danger/50">
                        {item.user}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-success mb-2 uppercase tracking-wider font-bold">推荐表达</div>
                      <div className="p-3 bg-success/10 border border-success/30 rounded-lg text-sm text-success font-medium">
                        {item.correction}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <div className="text-xs text-purple-400 mb-2 uppercase tracking-wider font-bold">AI 解析笔记</div>
                    <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl text-sm leading-relaxed">
                      {item.note}
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="flex items-center gap-2 text-sm text-text-muted hover:text-danger transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> 移除
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
