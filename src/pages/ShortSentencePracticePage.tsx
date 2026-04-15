import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Lightbulb, ArrowRight, BookMarked, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { shortSentences, shortSentenceTopics } from '../data/shortSentenceCorpus';

export default function ShortSentencePracticePage() {
  const { topicId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [sentences, setSentences] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [blanks, setBlanks] = useState<{index: number, word: string, cleanWord: string}[]>([]);
  const [userInputs, setUserInputs] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const topic = shortSentenceTopics.find(t => t.id === topicId);

  useEffect(() => {
    const filtered = shortSentences.filter(s => s.topicId === topicId);
    
    const countsKey = user ? `sentenceCounts_${user}` : 'sentenceCounts_guest';
    const counts = JSON.parse(localStorage.getItem(countsKey) || '{}');

    // Calculate weights: fewer encounters = higher weight
    let weightedSentences = filtered.map(s => {
      const count = counts[s.id] || 0;
      return {
        ...s,
        weight: 1 / Math.pow(count + 1, 2)
      };
    });

    // Weighted random shuffle
    const shuffled = [];
    while (weightedSentences.length > 0) {
      const totalWeight = weightedSentences.reduce((sum, s) => sum + s.weight, 0);
      let random = Math.random() * totalWeight;
      let selectedIndex = 0;
      for (let i = 0; i < weightedSentences.length; i++) {
        random -= weightedSentences[i].weight;
        if (random <= 0) {
          selectedIndex = i;
          break;
        }
      }
      shuffled.push(weightedSentences[selectedIndex]);
      weightedSentences.splice(selectedIndex, 1);
    }

    setSentences(shuffled);
  }, [topicId, user]);

  useEffect(() => {
    if (sentences.length > 0 && currentIndex < sentences.length) {
      const sentence = sentences[currentIndex];
      const words = sentence.english.split(' ');
      
      // 排除冠词、人称代词、常见介词、be动词以及缩写形式（去除标点后）
      const stopWords = new Set([
        'a', 'an', 'the',
        'i', 'me', 'my', 'mine', 'myself',
        'you', 'your', 'yours', 'yourself', 'yourselves',
        'he', 'him', 'his', 'himself',
        'she', 'her', 'hers', 'herself',
        'it', 'its', 'itself',
        'we', 'us', 'our', 'ours', 'ourselves',
        'they', 'them', 'their', 'theirs', 'themselves',
        // 常见缩写（去除撇号后）
        'im', 'ive', 'ill', 'id', 'youre', 'youve', 'youll', 'youd', 
        'hes', 'hell', 'hed', 'shes', 'shell', 'shed', 
        'were', 'weve', 'well', 'wed', 'theyre', 'theyve', 'theyll', 'theyd',
        'dont', 'doesnt', 'didnt', 'isnt', 'arent', 'wasnt', 'werent', 
        'havent', 'hasnt', 'hadnt', 'wont', 'wouldnt', 'cant', 'couldnt', 
        'shouldnt', 'mustnt', 'thats', 'theres', 'whats', 'whos', 'wheres', 'hows', 'lets',
        // 常见介词、连词、be动词等（可选，为了让挖空更聚焦于核心词汇）
        'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
        'do', 'does', 'did', 'have', 'has', 'had',
        'to', 'in', 'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
        'into', 'through', 'during', 'before', 'after', 'above', 'below', 'from',
        'up', 'down', 'of', 'off', 'over', 'under', 'again', 'further', 'then',
        'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any',
        'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
        'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
        'can', 'will', 'just', 'should', 'now', 'and', 'or', 'but', 'if', 'because', 'as', 'until', 'while'
      ]);

      // 寻找候选词：去掉标点符号，且不在停用词表中，长度大于1（排除单字母）
      const candidates = words
        .map((word: string, index: number) => ({ index, word, cleanWord: word.replace(/[^a-zA-Z]/g, '') }))
        .filter((item: any) => item.cleanWord.length > 1 && !stopWords.has(item.cleanWord.toLowerCase()));
      
      // 根据句子长度决定挖空数量，较长的句子最多挖4个空
      const calculatedBlanks = Math.min(Math.max(1, Math.floor(words.length / 4)), 4);
      const numBlanks = Math.min(calculatedBlanks, candidates.length);
      
      // 按词长分配权重（长度越长，被挖空的概率呈指数级增加）
      // 采用加权随机抽样（Weighted Random Sampling without replacement）
      let weightedCandidates = candidates.map((c: any) => ({
        ...c,
        weight: Math.pow(c.cleanWord.length, 2) // 长度的平方作为权重，显著提高长词被选中的概率
      }));

      const selectedBlanks = [];
      for (let i = 0; i < numBlanks; i++) {
        if (weightedCandidates.length === 0) break;
        
        const totalWeight = weightedCandidates.reduce((sum: number, c: any) => sum + c.weight, 0);
        let random = Math.random() * totalWeight;
        
        let selectedIndex = 0;
        for (let j = 0; j < weightedCandidates.length; j++) {
          random -= weightedCandidates[j].weight;
          if (random <= 0) {
            selectedIndex = j;
            break;
          }
        }
        
        selectedBlanks.push(weightedCandidates[selectedIndex]);
        weightedCandidates.splice(selectedIndex, 1); // 移除已选中的词
      }
      
      // Sort by index so they appear in order
      selectedBlanks.sort((a, b) => a.index - b.index);
      
      setBlanks(selectedBlanks);
      setUserInputs(new Array(selectedBlanks.length).fill(''));
      setIsSubmitted(false);
      setIsCorrect(false);
      setShowHint(false);
      setIsSaved(false);
    }
  }, [currentIndex, sentences]);

  const handleInputChange = (index: number, value: string) => {
    const newInputs = [...userInputs];
    newInputs[index] = value;
    setUserInputs(newInputs);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        if (!userInputs.some(input => input.trim() === '')) {
          handleSubmit();
        }
      } else {
        e.preventDefault();
        const nextInput = document.querySelector(`input[data-index="${index + 1}"]`) as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
        }
      }
    }
  };

  const handleSubmit = () => {
    if (userInputs.some(input => input.trim() === '')) return;
    
    let correct = true;
    blanks.forEach((blank, i) => {
      if (userInputs[i].trim().toLowerCase() !== blank.cleanWord.toLowerCase()) {
        correct = false;
      }
    });
    
    setIsCorrect(correct);
    setIsSubmitted(true);

    // Increment encounter count
    const countsKey = user ? `sentenceCounts_${user}` : 'sentenceCounts_guest';
    const counts = JSON.parse(localStorage.getItem(countsKey) || '{}');
    const currentSentenceId = sentences[currentIndex].id;
    counts[currentSentenceId] = (counts[currentSentenceId] || 0) + 1;
    localStorage.setItem(countsKey, JSON.stringify(counts));

    // Save to history
    const historyKey = user ? `practiceHistory_${user}` : 'practiceHistory_guest';
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    history.unshift({
      id: Date.now(),
      userId: user || 'guest',
      type: '短句',
      title: topic?.title || '短句训练',
      timestamp: new Date().toISOString(),
      score: correct ? 100 : 0
    });
    localStorage.setItem(historyKey, JSON.stringify(history));
  };

  const handleNext = () => {
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Finished
      navigate('/short-sentence');
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 只有在已提交状态，且按下的是纯 Enter 键（没有按 Ctrl/Meta），且不是长按连发时，才进入下一题
      if (e.key === 'Enter' && isSubmitted && !e.ctrlKey && !e.metaKey && !e.repeat) {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isSubmitted, currentIndex, sentences.length, navigate]);

  const handleSaveToErrorBook = () => {
    if (isSaved) return;
    
    const errorBookKey = user ? `errorBook_${user}` : 'errorBook_guest';
    const saved = localStorage.getItem(errorBookKey);
    const errorItems = saved ? JSON.parse(saved) : [];
    
    const currentSentence = sentences[currentIndex];
    
    const newItem = {
      id: Date.now(),
      type: 'short-sentence',
      corpusId: currentSentence.id,
      corpusTitle: topic?.title || '短句训练',
      expressions: [
        { english: currentSentence.english, chinese: currentSentence.chinese }
      ],
      date: new Date().toISOString().split('T')[0]
    };
    
    errorItems.unshift(newItem);
    localStorage.setItem(errorBookKey, JSON.stringify(errorItems));
    setIsSaved(true);
  };

  if (sentences.length === 0) {
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
          <p className="text-text-muted">当前主题下暂无短句练习题目。</p>
        </div>
      </div>
    );
  }

  const currentSentence = sentences[currentIndex];
  const words = currentSentence.english.split(' ');

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link 
          to="/short-sentence"
          className="flex items-center gap-2 text-text-muted hover:text-text-main transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> 返回主题列表
        </Link>
        <div className="text-sm font-medium text-text-muted bg-surface px-3 py-1 rounded-full border border-border">
          {currentIndex + 1} / {sentences.length}
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-surface border border-border rounded-2xl p-8 md:p-12 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        
        <div className="relative z-10 space-y-10">
          {/* Chinese Source */}
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold leading-relaxed">
              {currentSentence.chinese}
            </h2>
          </div>

          {/* English Fill-in-the-blank */}
          <div className="flex flex-wrap items-center justify-center gap-y-4 gap-x-2 text-xl md:text-2xl font-medium">
            {words.map((word: string, i: number) => {
              const blankIndex = blanks.findIndex(b => b.index === i);
              if (blankIndex !== -1) {
                const blank = blanks[blankIndex];
                const prefix = word.substring(0, word.indexOf(blank.cleanWord));
                const suffix = word.substring(word.indexOf(blank.cleanWord) + blank.cleanWord.length);
                
                return (
                  <span key={i} className="flex items-center">
                    {prefix}
                    <input
                      type="text"
                      value={userInputs[blankIndex]}
                      onChange={(e) => handleInputChange(blankIndex, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, blankIndex)}
                      disabled={isSubmitted}
                      data-index={blankIndex}
                      className={`mx-1 w-24 md:w-32 text-center bg-background border-b-2 focus:outline-none transition-colors ${
                        isSubmitted 
                          ? userInputs[blankIndex].trim().toLowerCase() === blank.cleanWord.toLowerCase()
                            ? 'border-success text-success'
                            : 'border-danger text-danger'
                          : 'border-blue-500/50 focus:border-blue-500 text-primary'
                      }`}
                      autoFocus={blankIndex === 0}
                    />
                    {suffix}
                  </span>
                );
              }
              return <span key={i}>{word}</span>;
            })}
          </div>

          {/* Actions */}
          {!isSubmitted ? (
            <div className="flex flex-col items-center gap-4 pt-6">
              <button 
                onClick={handleSubmit}
                disabled={userInputs.some(i => i.trim() === '')}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-10 py-3.5 rounded-full font-bold transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]"
              >
                提交答案
              </button>
              <button 
                onClick={() => setShowHint(true)}
                className="text-sm text-text-muted hover:text-blue-400 flex items-center gap-1 transition-colors"
              >
                <Lightbulb className="w-4 h-4" /> 需要提示？
              </button>
              
              <div className="text-xs text-text-muted mt-2">
                快捷键: <kbd className="bg-surface border border-border rounded px-1.5 py-0.5 font-mono">Enter</kbd> 切换下一格，<kbd className="bg-surface border border-border rounded px-1.5 py-0.5 font-mono">Ctrl</kbd> + <kbd className="bg-surface border border-border rounded px-1.5 py-0.5 font-mono">Enter</kbd> 提交
              </div>

              {showHint && (
                <div className="text-sm text-blue-400 bg-blue-500/10 px-4 py-2 rounded-lg border border-blue-500/20">
                  提示: {blanks.map(b => b.cleanWord.charAt(0) + '...').join(', ')}
                </div>
              )}
            </div>
          ) : (
            <div className="pt-6 space-y-6">
              {/* Result Feedback */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                isCorrect ? 'bg-success/10 border-success/30 text-success' : 'bg-danger/10 border-danger/30 text-danger'
              }`}>
                {isCorrect ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <XCircle className="w-6 h-6 shrink-0" />}
                <div>
                  <h4 className="font-bold mb-1">{isCorrect ? '完全正确！' : '还有提升空间'}</h4>
                  {!isCorrect && (
                    <p className="text-sm opacity-90">
                      正确答案是: <span className="font-bold">{currentSentence.english}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Next Actions */}
              <div className="flex items-center justify-between">
                <button 
                  onClick={handleSaveToErrorBook}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${
                    isSaved ? 'text-purple-400 bg-purple-500/10 border-purple-500/30' : 'text-text-muted hover:text-purple-400 bg-surface border-border hover:border-purple-500/30'
                  }`}
                >
                  <BookMarked className="w-4 h-4" />
                  {isSaved ? '已收藏' : '加入错题本'}
                </button>
                
                <div className="flex flex-col items-end gap-2">
                  <button 
                    onClick={handleNext}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                  >
                    {currentIndex < sentences.length - 1 ? '下一题' : '完成训练'} 
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <div className="text-xs text-text-muted">
                    按 <kbd className="bg-surface border border-border rounded px-1.5 py-0.5 font-mono">Enter</kbd> 继续
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
