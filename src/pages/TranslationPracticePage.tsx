import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Edit3, Send, Loader2, Info, AlertCircle, CheckCircle2, Sparkles, RefreshCcw, BookMarked, Share2 } from 'lucide-react';
import { corpus, CorpusItem } from '../data/corpus';
import { useAuth } from '../contexts/AuthContext';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

const DEFAULT_PROMPT = `You are an expert English teacher and translator. 
The user is practicing "back-translation" (translating a Chinese text back into its original English form).

Original Chinese text: "{{chinese}}"
Original English text: "{{english}}"
User's back-translation: "{{user_translation}}"

Please analyze the user's translation. 
1. 总结全文最重要的6个表达差异
2. Compare it to the original English text.（逐词逐句分析）
3. Provide specific suggestions on grammar, word choice, and idiomatic expression.
4. Highlight what they did well.
5. Keep your feedback constructive and easy to understand. Format your response in Markdown.
6. 忽略基础拼写与语法错误，指出重要语法错误`;

export default function TranslationPracticePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState<CorpusItem | null>(null);
  const [userTranslation, setUserTranslation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('');
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const foundItem = corpus.find(c => c.id === id);
    if (foundItem) {
      setItem(foundItem);
    } else {
      navigate('/corpus');
    }
  }, [id, navigate]);

  const handleSubmit = async () => {
    if (!userTranslation.trim() || !item) return;
    
    setIsSubmitting(true);
    setShowOriginal(true);
    setError('');
    setAiFeedback('');

    // Scroll to original text section
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    try {
      const prompt = DEFAULT_PROMPT
        .replace('{{chinese}}', item.chinese)
        .replace('{{english}}', item.english)
        .replace('{{user_translation}}', userTranslation);

      const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
      
      if (!apiKey) {
        throw new Error('DeepSeek API Key is missing. Please set VITE_DEEPSEEK_API_KEY in your .env file.');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: `【中文原文】\n${item.chinese}\n\n【用户英文翻译】\n${userTranslation}` }
          ],
          temperature: 0.3
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      const feedbackText = data.choices[0].message.content;
      setAiFeedback(feedbackText);

      // Mark as completed
      const completedIds = JSON.parse(localStorage.getItem('completedCorpusIds') || '[]');
      if (!completedIds.includes(item.id)) {
        completedIds.push(item.id);
        localStorage.setItem('completedCorpusIds', JSON.stringify(completedIds));
      }

      // Save practice history
      const history = JSON.parse(localStorage.getItem('practiceHistory') || '[]');
      const historyId = Date.now();
      history.unshift({
        id: historyId,
        userId: user || 'guest',
        title: item.chinese.length > 15 ? item.chinese.substring(0, 15) + '...' : item.chinese,
        type: '回译',
        score: 90,
        timestamp: new Date().toISOString(),
        item: item,
        userTranslation: userTranslation,
        feedback: feedbackText
      });
      localStorage.setItem('practiceHistory', JSON.stringify(history));

      // Save result for history page
      localStorage.setItem('lastAnalysisResult', JSON.stringify({
        item,
        userTranslation,
        feedback: feedbackText,
        timestamp: historyId
      }));

      setIsSubmitting(false);
    } catch (err: any) {
      console.error('Error generating feedback:', err);
      if (err.name === 'AbortError') {
        setError('请求超时，请检查网络连接或稍后重试。');
      } else {
        setError(`分析时发生错误: ${err.message}`);
      }
      setIsSubmitting(false);
    }
  };

  const handleSaveToErrorBook = () => {
    if (!item || !aiFeedback || isSaved) return;
    
    const saved = localStorage.getItem('errorBook');
    const errorItems = saved ? JSON.parse(saved) : [];
    
    const newItem = {
      id: Date.now(),
      type: 'translation',
      source: item.chinese,
      user: userTranslation,
      correction: item.english,
      note: aiFeedback.substring(0, 200) + '...',
      date: new Date().toISOString().split('T')[0]
    };
    
    errorItems.unshift(newItem);
    localStorage.setItem('errorBook', JSON.stringify(errorItems));
    setIsSaved(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !showOriginal) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!item) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/corpus')}
          className="flex items-center gap-2 text-text-muted hover:text-text-main transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> 返回主题列表
        </button>
        <div className="text-sm font-medium text-text-muted bg-surface px-3 py-1 rounded-full border border-border">
          回译训练模式
        </div>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Text Area */}
        <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <div className="bg-primary/20 p-2 rounded-lg text-primary">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">中文原文 (Source)</h2>
          </div>
          
          <div className="flex-1 bg-background rounded-xl p-6 border border-border">
            <p className="text-lg leading-relaxed font-medium whitespace-pre-wrap">
              {item.chinese}
            </p>
          </div>
          
          <div className="mt-6 flex items-start gap-3 text-sm text-text-muted bg-primary/5 p-4 rounded-xl border border-primary/10">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p>请仔细阅读左侧的中文原文，并在右侧输入框中将其翻译回英文。尽量使用地道的表达方式。</p>
          </div>
        </div>

        {/* Translation Input Area */}
        <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          <div className="flex items-center gap-2 mb-6 relative z-10">
            <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">你的翻译 (Target)</h2>
          </div>
          
          <div className="flex-1 flex flex-col relative z-10">
            <textarea
              ref={textareaRef}
              value={userTranslation}
              onChange={(e) => setUserTranslation(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={showOriginal}
              placeholder="在此输入你的英文翻译... (按 Enter 提交)"
              className="flex-1 w-full min-h-[200px] p-6 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all resize-none text-lg leading-relaxed disabled:opacity-50"
              autoFocus
            />
            
            {!showOriginal && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={!userTranslation.trim() || isSubmitting}
                  className="flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:bg-surface disabled:text-text-muted disabled:border-border text-background px-8 py-3.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(0,216,255,0.2)] disabled:shadow-none"
                >
                  <span>提交</span>
                  <Send className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Result Section */}
      <AnimatePresence>
        {showOriginal && (
          <motion.div 
            ref={resultRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pt-8 border-t border-border/50"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Original English */}
              <div className="bg-surface border border-success/30 rounded-2xl p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex items-center gap-2 mb-4 relative z-10">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <h3 className="font-bold text-success">地道原文 (Original)</h3>
                </div>
                <p className="text-xl font-medium relative z-10 whitespace-pre-wrap leading-relaxed">
                  {item.english}
                </p>
              </div>

              {/* AI Feedback */}
              <div className="bg-surface border border-primary/30 rounded-2xl p-6 md:p-8 shadow-[0_0_30px_rgba(0,216,255,0.05)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/20 p-2 rounded-lg text-primary">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold">AI 深度解析</h2>
                  </div>
                  
                  {aiFeedback && (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleSaveToErrorBook}
                        className={`p-2 rounded-lg transition-colors border ${isSaved ? 'text-purple-400 bg-purple-500/10 border-purple-500/30' : 'text-text-muted hover:text-purple-400 bg-surface border-border'}`} 
                        title={isSaved ? "已加入错题本" : "加入错题本"}
                      >
                        <BookMarked className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                {isSubmitting && !aiFeedback ? (
                  <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                    <p className="animate-pulse">AI 正在分析您的翻译，请稍候...</p>
                  </div>
                ) : (
                  <div className="prose prose-invert prose-p:text-text-main prose-headings:text-text-main prose-a:text-primary hover:prose-a:text-primary-hover prose-strong:text-primary prose-code:text-pink-400 prose-code:bg-pink-400/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none max-w-none relative z-10">
                    <Markdown>{aiFeedback}</Markdown>
                  </div>
                )}
              </div>
            </div>

            {/* Next Action */}
            {aiFeedback && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center pt-8"
              >
                <Link
                  to="/corpus"
                  className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-background px-8 py-3.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(0,216,255,0.2)] hover:scale-105"
                >
                  <RefreshCcw className="w-5 h-5" />
                  <span>继续下一篇</span>
                </Link>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
