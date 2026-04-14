import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Search, Calendar, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function HistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const historyKey = user ? `practiceHistory_${user}` : 'practiceHistory_guest';
    const userHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
    setHistory(userHistory);
  }, [user]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredHistory = history.filter(h => 
    h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-text-muted hover:text-text-main transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> 返回主页
        </button>
        <h1 className="text-2xl font-bold">全部练习记录</h1>
      </div>

      {/* Search & Stats */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-surface border border-border p-4 rounded-2xl">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input 
            type="text" 
            placeholder="搜索练习记录..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-6 px-4">
          <div className="text-center">
            <div className="text-xs text-text-muted uppercase tracking-wider mb-1">总计</div>
            <div className="text-xl font-bold">{history.length}</div>
          </div>
          <div className="w-px h-8 bg-border"></div>
          <div className="text-center">
            <div className="text-xs text-text-muted uppercase tracking-wider mb-1">本周</div>
            <div className="text-xl font-bold">
              {history.filter(h => {
                const d = new Date(h.timestamp);
                const now = new Date();
                const diff = now.getTime() - d.getTime();
                return diff < 7 * 24 * 60 * 60 * 1000;
              }).length}
            </div>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {filteredHistory.length === 0 ? (
          <div className="py-20 text-center text-text-muted">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>没有找到相关记录</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredHistory.map((record) => (
              <Link 
                key={record.id}
                to={`/analysis/${record.id}`}
                className="flex items-center justify-between p-5 hover:bg-surface-hover transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${record.type === '回译' ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-400'}`}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold group-hover:text-primary transition-colors">{record.title}</div>
                    <div className="text-sm text-text-muted flex items-center gap-2">
                      <span>{record.type}</span>
                      <span className="w-1 h-1 rounded-full bg-border"></span>
                      <span>{formatTime(record.timestamp)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className={`text-lg font-bold ${record.score >= 80 ? 'text-success' : record.score > 0 ? 'text-warning' : 'text-danger'}`}>
                      {record.score} <span className="text-xs font-normal text-text-muted">分</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-muted group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
