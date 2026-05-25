import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Edit3, BookMarked, Bell, LogOut, User, Settings, Mail, RefreshCcw, BarChart3, Cloud, HardDrive, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, displayName, username, role, authMode, syncState, syncError, logout, syncCloudData } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSyncCloudData = async () => {
    await syncCloudData().catch(() => undefined);
  };

  const navItems = [
    { path: '/dashboard', label: '主页', icon: <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-primary" /></div> },
    { path: '/corpus', label: '回译训练', icon: <BookOpen className="w-4 h-4" /> },
    { path: '/review', label: '复习回译', icon: <RefreshCcw className="w-4 h-4" /> },
    { path: '/short-sentence', label: '短句训练', icon: <Edit3 className="w-4 h-4" /> },
    { path: '/error-book', label: '错题本', icon: <BookMarked className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-border bg-surface/50 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-3 sm:px-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-tight">BackTrans</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-text-muted hover:text-text-main hover:bg-surface-hover"
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative" ref={settingsRef}>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-text-muted hover:text-text-main rounded-full hover:bg-surface-hover transition-colors relative"
              title="设置"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            {showSettings && (
              <div className="absolute right-0 mt-2 w-64 bg-surface border border-border rounded-xl shadow-lg overflow-hidden z-50">
                <div className="p-4 border-b border-border">
                  <h3 className="font-bold text-sm">设置与关于</h3>
                </div>
                <div className="p-6 text-center text-text-muted space-y-3">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto text-blue-500">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-main mb-1">联系作者</p>
                    <a href="mailto:wtifimyf@gmail.com" className="text-sm text-blue-500 hover:underline">
                      wtifimyf@gmail.com
                    </a>
                    {role === 'admin' && (
                      <Link
                        to="/analytics"
                        onClick={() => setShowSettings(false)}
                        className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold text-text-main transition-colors hover:border-primary/40 hover:text-primary"
                      >
                        <BarChart3 className="h-4 w-4" />
                        产品数据看板
                      </Link>
                    )}
                    <p className="mt-3 text-xs leading-relaxed text-text-muted">
                      AI 分析与云端账号由后端代理处理，不会在前端保存 API Key。
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-text-muted hover:text-text-main rounded-full hover:bg-surface-hover transition-colors relative"
            >
              <Bell className="w-5 h-5" />
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-64 bg-surface border border-border rounded-xl shadow-lg overflow-hidden z-50">
                <div className="p-4 border-b border-border">
                  <h3 className="font-bold text-sm">通知</h3>
                </div>
                <div className="p-6 text-center text-text-muted text-sm">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  暂无新通知
                </div>
              </div>
            )}
          </div>
          
          <div className="relative ml-2" ref={profileRef}>
            <div 
              className="flex items-center gap-2 cursor-pointer hover:bg-surface-hover p-1 pr-3 rounded-full transition-colors border border-border"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center overflow-hidden">
                <span className="text-background font-bold text-sm">
                  {(displayName || user || '?').charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium hidden sm:block">
                {displayName || (user ? user : '游客模式')}
              </span>
            </div>
            
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-surface border border-border rounded-xl shadow-lg overflow-hidden z-50">
                {user ? (
                  <>
                    <div className="p-4 border-b border-border">
                      <p className="mb-1 flex items-center gap-1 text-xs text-text-muted">
                        {authMode === 'cloud' ? <Cloud className="h-3 w-3" /> : <HardDrive className="h-3 w-3" />}
                        {authMode === 'cloud' ? '云端账号' : '本地档案'}
                        {role === 'admin' && <ShieldCheck className="h-3 w-3 text-primary" />}
                      </p>
                      <p className="font-bold text-sm truncate">{displayName || user}</p>
                      {username && <p className="mt-1 truncate text-xs text-text-muted">@{username}</p>}
                      {authMode === 'cloud' && (
                        <p className={`mt-2 text-xs ${syncState === 'error' ? 'text-danger' : 'text-text-muted'}`}>
                          {syncState === 'syncing'
                            ? '云端同步中...'
                            : syncState === 'synced'
                              ? '学习记录已同步'
                              : syncState === 'error'
                                ? syncError || '云端同步失败'
                                : '云端同步已开启'}
                        </p>
                      )}
                    </div>
                    <div className="p-2">
                      {authMode === 'cloud' && (
                        <button
                          onClick={handleSyncCloudData}
                          disabled={syncState === 'syncing'}
                          className="mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-text-main transition-colors hover:bg-surface-hover disabled:opacity-60"
                        >
                          <RefreshCcw className={`h-4 w-4 ${syncState === 'syncing' ? 'animate-spin' : ''}`} />
                          同步学习记录
                        </button>
                      )}
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-danger/10 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        退出登录
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-2 space-y-1">
                    <div className="p-3 border-b border-border mb-1">
                      <p className="text-xs text-text-muted">您当前以游客身份访问</p>
                    </div>
                    <Link 
                      to="/login"
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-text-main hover:bg-surface-hover rounded-lg transition-colors"
                    >
                      <User className="w-4 h-4" />
                      登录账号
                    </Link>
                    <Link 
                      to="/register"
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors font-medium"
                    >
                      <Edit3 className="w-4 h-4" />
                      创建账号
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 px-2 py-2 backdrop-blur md:hidden">
        <div className="grid grid-cols-5 gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[10px] font-medium transition-colors sm:text-xs",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-text-muted hover:bg-surface-hover hover:text-text-main"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
