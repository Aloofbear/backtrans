import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowRight, AlertCircle } from 'lucide-react';
import { corpus, corpusTopics } from '../data/corpus';

export default function CorpusSelectPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleTopicSelect = (topicId: string) => {
    setError('');
    
    // Get all corpus items for this topic
    const topicCorpus = corpus.filter(c => c.topicId === topicId);
    
    if (topicCorpus.length === 0) {
      setError(`该主题下暂无语料，请在代码中添加 (topicId: ${topicId})。`);
      return;
    }

    // Get completed items from localStorage
    const completedIds = JSON.parse(localStorage.getItem('completedCorpusIds') || '[]');
    
    // Filter out completed items
    const availableCorpus = topicCorpus.filter(c => !completedIds.includes(c.id));

    if (availableCorpus.length === 0) {
      setError('太棒了！您已完成该主题下的所有语料训练。');
      return;
    }

    // Pick a random item
    const randomItem = availableCorpus[Math.floor(Math.random() * availableCorpus.length)];
    
    // Navigate to practice page
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
          const totalCount = corpus.filter(c => c.topicId === topic.id).length;
          const completedIds = JSON.parse(localStorage.getItem('completedCorpusIds') || '[]');
          const completedCount = corpus.filter(c => c.topicId === topic.id && completedIds.includes(c.id)).length;

          return (
            <button 
              key={topic.id}
              onClick={() => handleTopicSelect(topic.id)}
              className="bg-surface border border-border rounded-2xl p-6 hover:border-primary/50 transition-all hover:-translate-y-1 group flex flex-col text-left h-full"
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
