import { Link } from 'react-router-dom';
import { ArrowRight, Play, BookOpen, Edit3, BookMarked, Keyboard, Cpu, TrendingUp } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-text-main font-sans selection:bg-primary/30">
      {/* Header */}
      <header className="container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xl tracking-tight">BackTrans</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">登录</Link>
          <Link to="/register" className="bg-primary hover:bg-primary-hover text-background px-5 py-2 rounded-full text-sm font-bold transition-colors">
            免费注册
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 pt-20 pb-32 flex flex-col items-center">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            打破语言瓶颈 <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400 drop-shadow-[0_0_30px_rgba(0,216,255,0.3)]">
              智能回译训练平台
            </span>
          </h1>
          
          <p className="text-lg text-text-muted mb-10 max-w-2xl mx-auto leading-relaxed">
            通过"回译训练法"结合多维度 AI 实时打分，精准定位语法盲区，全面提升地道表达能力。
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <Link to="/dashboard" className="bg-primary hover:bg-primary-hover text-background px-8 py-3.5 rounded-full font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-[0_0_20px_rgba(0,216,255,0.4)]">
              开始测评体验 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Feature Preview Cards */}
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-32">
          {/* Main Feature Card */}
          <div className="md:col-span-2 bg-surface border border-border rounded-2xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary/20 p-2 rounded-lg text-primary">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium px-2 py-1 bg-surface-hover rounded border border-border">AI 驱动</span>
            </div>
            
            <h3 className="text-2xl font-bold mb-2">回译训练</h3>
            <p className="text-text-muted text-sm mb-8 max-w-md">左右对照布局，中译英。提交后 AI 将从语法、词汇、流畅度进行多维度评分。</p>
            
            {/* Mock UI inside card */}
            <div className="bg-background rounded-xl border border-border p-4 flex gap-4 opacity-80 group-hover:opacity-100 transition-opacity">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-xs text-text-muted mb-2"><BookOpen className="w-3 h-3"/> 原文 (Source)</div>
                <div className="bg-surface p-3 rounded-lg text-sm">随着人工智能的发展，我们的生活方式正在经历前所未有的变革。</div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-xs text-primary mb-2"><Edit3 className="w-3 h-3"/> 你的翻译 (Target)</div>
                <div className="bg-surface p-3 rounded-lg text-sm border border-primary/30">With the development of AI, our lifestyle is experiencing unprecedented changes.</div>
              </div>
            </div>
          </div>

          {/* Side Feature Cards */}
          <div className="space-y-6">
            <div className="bg-surface border border-border rounded-2xl p-6 h-[calc(50%-12px)]">
              <div className="bg-blue-500/20 w-10 h-10 rounded-lg flex items-center justify-center text-blue-400 mb-4">
                <Edit3 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-2">短句训练</h3>
              <p className="text-text-muted text-xs mb-4">根据提示词填空，强化记忆。</p>
              <div className="bg-background rounded-lg p-3 text-sm border border-border">
                <span className="text-text-muted text-xs block mb-1">这简直难以置信。</span>
                It's <span className="border-b border-text-muted inline-block w-8"></span> <span className="border-b border-text-muted inline-block w-12"></span>.
              </div>
            </div>
            
            <div className="bg-surface border border-border rounded-2xl p-6 h-[calc(50%-12px)] relative overflow-hidden">
              <div className="bg-purple-500/20 w-10 h-10 rounded-lg flex items-center justify-center text-purple-400 mb-4">
                <BookMarked className="w-5 h-5" />
              </div>
              <div className="absolute top-6 right-6 text-xs text-text-muted bg-background px-2 py-1 rounded border border-border">12 待复习</div>
              <h3 className="text-lg font-bold mb-2">错题本</h3>
              <p className="text-text-muted text-xs mb-4">自动记录生词与不地道表达</p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-background border border-border px-2 py-1 rounded-full">unprecedented</span>
                <span className="text-xs bg-background border border-border px-2 py-1 rounded-full">breakthrough</span>
                <span className="text-xs bg-background border border-border px-2 py-1 rounded-full text-text-muted">+9</span>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Section */}
        <div className="text-center mb-32 w-full max-w-5xl">
          <h2 className="text-3xl font-bold mb-4">AI 深度解析学习流</h2>
          <p className="text-text-muted mb-16">从输入到反馈，每一步都由底层大模型为你精准把控</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-[1px] bg-gradient-to-r from-transparent via-border to-transparent"></div>
            
            <div className="flex flex-col items-center relative z-10">
              <div className="w-24 h-24 rounded-2xl bg-surface border border-border flex items-center justify-center mb-6 shadow-lg">
                <Keyboard className="w-10 h-10 text-text-muted" />
              </div>
              <h4 className="text-xl font-bold mb-3">1. 沉浸式输入</h4>
              <p className="text-sm text-text-muted max-w-[250px]">提供真实语境原文，进行无干扰的翻译输出练习。</p>
            </div>
            
            <div className="flex flex-col items-center relative z-10">
              <div className="w-24 h-24 rounded-2xl bg-surface border border-primary/50 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,216,255,0.15)] relative">
                <div className="absolute inset-0 bg-primary/10 rounded-2xl animate-pulse"></div>
                <Cpu className="w-10 h-10 text-primary" />
              </div>
              <h4 className="text-xl font-bold mb-3">2. 多维 AI 诊断</h4>
              <p className="text-sm text-text-muted max-w-[250px]">AI完成语法、词汇、地道性及语篇逻辑的深度分析。</p>
            </div>
            
            <div className="flex flex-col items-center relative z-10">
              <div className="w-24 h-24 rounded-2xl bg-surface border border-border flex items-center justify-center mb-6 shadow-lg">
                <TrendingUp className="w-10 h-10 text-text-muted" />
              </div>
              <h4 className="text-xl font-bold mb-3">3. 闭环提升</h4>
              <p className="text-sm text-text-muted max-w-[250px]">错误自动收录错题本，针对性生成复习计划。</p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="w-full max-w-4xl bg-surface border border-border rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent"></div>
          <h2 className="text-3xl font-bold mb-4 relative z-10">准备好突破语言瓶颈了吗？</h2>
          <p className="text-text-muted mb-8 relative z-10">立即注册，免费体验完整的 AI 回译训练流程，开启你的高效语言学习之旅。</p>
          <div className="flex items-center justify-center gap-4 relative z-10">
            <Link to="/register" className="bg-primary hover:bg-primary-hover text-background px-8 py-3 rounded-full font-bold transition-colors">
              创建免费账号
            </Link>
            <Link to="/login" className="px-8 py-3 rounded-full font-medium border border-border hover:bg-surface-hover transition-colors">
              已有账号登录
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
