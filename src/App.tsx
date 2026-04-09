import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';
import { BookOpen, CheckCircle2, Loader2, RefreshCcw, Send, Settings, Upload, X, Save } from 'lucide-react';
import { corpus, CorpusItem } from './data/corpus';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const DEFAULT_PROMPT = `You are an expert English teacher and translator. 
The user is practicing "back-translation" (translating a Chinese text back into its original English form).

Original Chinese text: "{{chinese}}"
Original English text: "{{english}}"
User's back-translation: "{{user_translation}}"

Please analyze the user's translation. 
1. Compare it to the original English text.
2. Provide specific suggestions on grammar, word choice, and idiomatic expression.
3. Highlight what they did well.
4. Keep your feedback constructive and easy to understand. Format your response in Markdown.`;

export default function App() {
  const [corpusList, setCorpusList] = useState<CorpusItem[]>(corpus);
  const [selectedItem, setSelectedItem] = useState<CorpusItem>(corpus[0]);
  const [userTranslation, setUserTranslation] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showDevSettings, setShowDevSettings] = useState(false);
  const [promptTemplate, setPromptTemplate] = useState(DEFAULT_PROMPT);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const savedCorpus = localStorage.getItem('corpusList');
    if (savedCorpus) {
      try {
        const parsed = JSON.parse(savedCorpus);
        if (parsed && parsed.length > 0) {
          setCorpusList(parsed);
          setSelectedItem(parsed[0]);
        }
      } catch (e) { console.error(e); }
    }
    const savedPrompt = localStorage.getItem('promptTemplate');
    if (savedPrompt) {
      setPromptTemplate(savedPrompt);
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          const newCorpus = json.map((item, index) => ({
            id: Date.now().toString() + index,
            chinese: item.chinese || item.zh || '',
            english: item.english || item.en || ''
          })).filter(item => item.chinese && item.english);
          
          if (newCorpus.length > 0) {
            setCorpusList(newCorpus);
            setSelectedItem(newCorpus[0]);
            localStorage.setItem('corpusList', JSON.stringify(newCorpus));
            alert('Corpus uploaded successfully!');
          } else {
            alert('Invalid format. Please upload a JSON array with "chinese" and "english" fields.');
          }
        }
      } catch (err) {
        alert('Error parsing JSON file. Please ensure it is valid JSON.');
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handleSavePrompt = () => {
    localStorage.setItem('promptTemplate', promptTemplate);
    alert('Prompt saved successfully!');
  };

  const handleSelect = (item: CorpusItem) => {
    setSelectedItem(item);
    setUserTranslation('');
    setIsSubmitted(false);
    setFeedback('');
    setIsAnalyzing(false);
  };

  const handleSubmit = async () => {
    if (!userTranslation.trim()) return;
    
    setIsSubmitted(true);
    setIsAnalyzing(true);
    setFeedback('');

    try {
      const prompt = promptTemplate
        .replace('{{chinese}}', selectedItem.chinese)
        .replace('{{english}}', selectedItem.english)
        .replace('{{user_translation}}', userTranslation);

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
      });

      setFeedback(response.text || 'No feedback generated.');
    } catch (error) {
      console.error('Error generating feedback:', error);
      setFeedback('An error occurred while generating feedback. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-gray-900 font-sans flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col h-auto md:h-screen sticky top-0">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Back-Translation
            </h1>
            <button 
              onClick={() => setShowDevSettings(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title="Developer Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">Select a text to practice</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {corpusList.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item)}
              className={`w-full text-left p-4 rounded-xl transition-all duration-200 border ${
                selectedItem.id === item.id
                  ? 'bg-blue-50 border-blue-200 shadow-sm'
                  : 'bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <p className={`text-sm line-clamp-2 ${selectedItem.id === item.id ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                {item.chinese}
              </p>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto h-screen">
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
          
          {/* Translation Area */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-gray-100 bg-gray-50/50">
              <span className="inline-block px-3 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded-full uppercase tracking-wider mb-4">
                Source Text
              </span>
              <p className="text-xl md:text-2xl font-medium leading-relaxed text-gray-800">
                {selectedItem.chinese}
              </p>
            </div>
            
            <div className="p-6 md:p-8">
              <label htmlFor="translation" className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
                Your Translation
              </label>
              <div className="relative">
                <textarea
                  id="translation"
                  ref={textareaRef}
                  value={userTranslation}
                  onChange={(e) => setUserTranslation(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isSubmitted}
                  placeholder="Type your English translation here... (Press Enter to submit)"
                  className="w-full min-h-[160px] p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-y text-gray-800 text-lg disabled:opacity-70 disabled:bg-gray-100"
                />
                {!isSubmitted && (
                  <div className="absolute bottom-4 right-4">
                    <button
                      onClick={handleSubmit}
                      disabled={!userTranslation.trim()}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                    >
                      <span>Submit</span>
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results Area */}
          {isSubmitted && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Original Text Reveal */}
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h3 className="text-sm font-semibold text-green-800 uppercase tracking-wider">
                    Original English Text
                  </h3>
                </div>
                <p className="text-lg md:text-xl text-green-900 font-medium">
                  {selectedItem.english}
                </p>
              </div>

              {/* AI Feedback */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 p-1.5 rounded-lg">
                    ✨
                  </span>
                  AI Analysis
                </h3>
                
                {isAnalyzing ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500 space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <p className="font-medium animate-pulse">Analyzing your translation...</p>
                  </div>
                ) : (
                  <div className="prose prose-blue max-w-none prose-p:leading-relaxed prose-headings:font-semibold">
                    <Markdown>{feedback}</Markdown>
                  </div>
                )}
              </div>

              {/* Next Action */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => {
                    const currentIndex = corpusList.findIndex(c => c.id === selectedItem.id);
                    const nextItem = corpusList[(currentIndex + 1) % corpusList.length];
                    handleSelect(nextItem);
                  }}
                  className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-xl font-medium transition-colors shadow-sm"
                >
                  <RefreshCcw className="w-4 h-4" />
                  <span>Try Another</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Developer Settings Modal */}
      {showDevSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-800">
                <Settings className="w-5 h-5 text-gray-600" />
                Developer Settings
              </h2>
              <button 
                onClick={() => setShowDevSettings(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-8">
              {/* Corpus Upload */}
              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-1">Upload Corpus</h3>
                  <p className="text-sm text-gray-500">Upload a JSON file containing an array of objects with <code className="bg-gray-100 px-1 py-0.5 rounded text-pink-600">chinese</code> and <code className="bg-gray-100 px-1 py-0.5 rounded text-pink-600">english</code> fields.</p>
                </div>
                <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-xl appearance-none cursor-pointer hover:border-blue-400 hover:bg-blue-50 focus:outline-none">
                  <span className="flex items-center space-x-2">
                    <Upload className="w-6 h-6 text-gray-400" />
                    <span className="font-medium text-gray-600">
                      Drop JSON file to upload, or browse
                    </span>
                  </span>
                  <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
                </label>
              </section>

              {/* Prompt Editor */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-1">AI Prompt Template</h3>
                    <p className="text-sm text-gray-500">Use <code className="bg-gray-100 px-1 py-0.5 rounded text-pink-600">{'{{chinese}}'}</code>, <code className="bg-gray-100 px-1 py-0.5 rounded text-pink-600">{'{{english}}'}</code>, and <code className="bg-gray-100 px-1 py-0.5 rounded text-pink-600">{'{{user_translation}}'}</code> as placeholders.</p>
                  </div>
                  <button 
                    onClick={handleSavePrompt}
                    className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save Prompt
                  </button>
                </div>
                <textarea
                  value={promptTemplate}
                  onChange={(e) => setPromptTemplate(e.target.value)}
                  className="w-full h-64 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-sm text-gray-800 resize-y"
                />
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
