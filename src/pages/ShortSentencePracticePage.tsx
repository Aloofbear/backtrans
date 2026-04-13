import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Lightbulb, ArrowRight, BookMarked, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ShortSentencePracticePage() {
  const { topicId } = useParams();
  const { user } = useAuth();
  
  // Mock data removed, simulating empty state
  const currentSentence = null;

  if (!currentSentence) {
    return (
      <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link 
            to="/short-sentence"
            className="flex items-center gap-2 text-text-muted hover:text-text-main transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> 返回主题列表
          </Link>
        </div>
        
        <div className="text-center py-20 bg-surface border border-border rounded-2xl">
          <BookOpen className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">暂未有题目</h3>
          <p className="text-text-muted">当前主题下暂无短句练习题目，请在代码中添加。</p>
        </div>
      </div>
    );
  }

  return null;
}
