import { Link } from 'react-router-dom';
import { Edit3, ArrowRight, Briefcase, Coffee, Plane, Heart, Zap, BookOpen } from 'lucide-react';

export default function ShortSentenceTopicsPage() {
  const topics: any[] = [];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
              <Edit3 className="w-6 h-6" />
            </div>
            短句强化训练
          </h1>
          <p className="text-text-muted">选择一个主题，通过填空练习快速掌握高频地道表达。</p>
        </div>
      </div>

      {topics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => (
            <Link 
              key={topic.id} 
              to={`/short-sentence/${topic.id}`}
              className="bg-surface border border-border rounded-2xl p-6 hover:border-blue-500/50 transition-all hover:-translate-y-1 group flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <div className={`${topic.bg} ${topic.color} p-3 rounded-xl`}>
                  {topic.icon}
                </div>
                <span className="text-xs font-medium text-text-muted bg-background px-2.5 py-1 rounded-full border border-border">
                  {topic.count} 句
                </span>
              </div>
              
              <h3 className="text-xl font-bold mb-2">{topic.title}</h3>
              <p className="text-sm text-text-muted mb-6 flex-1">
                掌握该场景下的核心句型和地道表达方式，提升口语和写作的自然度。
              </p>
              
              <div className="flex items-center text-blue-400 text-sm font-medium">
                开始练习 <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-surface border border-border rounded-2xl">
          <BookOpen className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">暂未有语料</h3>
          <p className="text-text-muted">短句训练语料库目前为空，请等待管理员添加。</p>
        </div>
      )}
    </div>
  );
}
