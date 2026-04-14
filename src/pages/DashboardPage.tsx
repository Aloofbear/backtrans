import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Edit3, BookMarked, TrendingUp, Clock, Target, ArrowRight, Flame } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [learningDays, setLearningDays] = useState(0);
  const [todayCompleted, setTodayCompleted] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const historyKey = user ? `practiceHistory_${user}` : 'practiceHistory_guest';
    const userHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
    setHistory(userHistory);

    const getLocalDateStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const dates = [...new Set(userHistory.map((r: any) => getLocalDateStr(new Date(r.timestamp))))].sort((a: any, b: any) => b.localeCompare(a));
    setLearningDays(dates.length);

    const todayStr = getLocalDateStr(new Date());
    setTodayCompleted(dates.includes(todayStr));

    // Generate chart data for last 7 days
    const last7Days = Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return getLocalDateStr(d);
    });

    const cData = last7Days.map(dateStr => {
      const dayRecords = userHistory.filter((h: any) => getLocalDateStr(new Date(h.timestamp)) === dateStr);
      const count = dayRecords.length;
      const height = Math.min((count / 10) * 100, 100); // max 10 records for 100% height
      return { dateStr, height, count };
    });
    setChartData(cData);

  }, [user]);

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    return `${Math.floor(hours / 24)}天前`;
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">欢迎回来，{user || '学习者'} 👋</h1>
          <p className="text-text-muted">
            {learningDays > 0 
              ? <>今天是您坚持学习的第 <span className="text-primary font-bold">{learningDays}</span> 天，继续保持！</>
              : '欢迎开始您的英语学习之旅！'
            }
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4">
            <div className={`p-2 rounded-lg ${learningDays > 0 ? 'bg-orange-500/20 text-orange-500' : 'bg-surface-hover text-text-muted'}`}>
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-text-muted">累计练习天数</div>
              <div className="text-xl font-bold">{learningDays} 天</div>
            </div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4">
            <div className={`p-2 rounded-lg ${todayCompleted ? 'bg-primary/20 text-primary' : 'bg-surface-hover text-text-muted'}`}>
              <Target className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-text-muted">今日目标完成度</div>
              <div className="text-xl font-bold">{todayCompleted ? '100%' : '0%'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <div className="w-1.5 h-6 bg-primary rounded-full"></div>
          开始训练
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Action Card 1 */}
          <Link to="/corpus" className="group bg-surface border border-border rounded-2xl p-6 hover:border-primary/50 transition-all hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors"></div>
            <div className="bg-primary/20 w-12 h-12 rounded-xl flex items-center justify-center text-primary mb-6">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">回译训练</h3>
            <p className="text-text-muted text-sm mb-6">选择语料进行中英互译，AI 深度解析你的语法和表达。</p>
            <div className="flex items-center text-primary text-sm font-medium">
              进入训练 <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Action Card 2 */}
          <Link to="/short-sentence" className="group bg-surface border border-border rounded-2xl p-6 hover:border-blue-500/50 transition-all hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10 transition-colors"></div>
            <div className="bg-blue-500/20 w-12 h-12 rounded-xl flex items-center justify-center text-blue-400 mb-6">
              <Edit3 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">短句训练</h3>
            <p className="text-text-muted text-sm mb-6">针对特定主题或语法点进行填空式高频强化训练。</p>
            <div className="flex items-center text-blue-400 text-sm font-medium">
              进入训练 <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Action Card 3 */}
          <Link to="/error-book" className="group bg-surface border border-border rounded-2xl p-6 hover:border-purple-500/50 transition-all hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/10 transition-colors"></div>
            <div className="bg-purple-500/20 w-12 h-12 rounded-xl flex items-center justify-center text-purple-400 mb-6">
              <BookMarked className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">错题本复习</h3>
            <p className="text-text-muted text-sm mb-6">复习之前做错的题目和收集的地道表达，巩固记忆。</p>
            <div className="flex items-center text-purple-400 text-sm font-medium">
              开始复习 <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              学习数据概览
            </h2>
          </div>
          
          {history.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-text-muted border-b border-border/50">
              <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
              <p>暂无学习数据，快去完成一次训练吧！</p>
            </div>
          ) : (
            <div className="h-64 flex items-end justify-between gap-2 pt-10 pb-4 border-b border-border/50 relative">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-text-muted pb-4">
                <span>10</span>
                <span>7</span>
                <span>5</span>
                <span>2</span>
                <span>0</span>
              </div>
              
              {/* Bars */}
              {chartData.map((data, i) => (
                <div key={i} className="w-full flex flex-col items-center gap-2 group ml-6 relative h-full justify-end">
                  <div className="w-full max-w-[40px] bg-primary/10 rounded-t-sm relative group-hover:bg-primary/20 transition-colors h-full flex items-end">
                    <div className="w-full bg-primary rounded-t-sm transition-all" style={{ height: `${data.height}%` }}></div>
                  </div>
                  <span className="text-xs text-text-muted">{data.dateStr.slice(-5)}</span>
                  {/* Tooltip */}
                  <div className="absolute -top-8 bg-surface border border-border px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {data.count} 次练习
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {history.length > 0 && (
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <div className="w-3 h-3 rounded-full bg-primary"></div> 练习次数
              </div>
            </div>
          )}
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-text-muted" />
            最近练习记录
          </h2>
          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="text-center py-10 text-text-muted">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">暂无练习记录</p>
              </div>
            ) : (
              history.slice(0, 5).map((record, i) => (
                <Link 
                  key={i} 
                  to={`/analysis/${record.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-hover transition-colors cursor-pointer border border-transparent hover:border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${record.type === '回译' ? 'bg-primary' : 'bg-blue-400'}`}></div>
                    <div>
                      <div className="text-sm font-medium line-clamp-1 max-w-[120px] sm:max-w-[150px]">{record.title}</div>
                      <div className="text-xs text-text-muted">{formatTimeAgo(record.timestamp)}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-sm font-bold ${record.score >= 80 ? 'text-success' : record.score > 0 ? 'text-warning' : 'text-danger'}`}>{record.score} 分</div>
                    <div className="text-xs text-text-muted">{record.type}</div>
                  </div>
                </Link>
              ))
            )}
          </div>
          {history.length > 0 && (
            <Link 
              to="/history"
              className="block w-full mt-6 py-2 text-center text-sm text-text-muted hover:text-text-main border border-border rounded-lg hover:bg-surface-hover transition-colors"
            >
              查看全部记录
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
