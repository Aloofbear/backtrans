import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Edit3, BookMarked, Search, Bell, LogOut, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/corpus?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const navItems = [
    { path: '/dashboard', label: '主页', icon: <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-primary" /></div> },
    { path: '/corpus', label: '回译训练', icon: <BookOpen className="w-4 h-4" /> },
    { path: '/short-sentence', label: '短句训练', icon: <Edit3 className="w-4 h-4" /> },
    { path: '/error-book', label: '错题本', icon: <BookMarked className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-border bg-surface/50 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6">
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
          <div className="relative hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="搜索语料... (按 Enter 搜索)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="bg-surface border border-border rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 w-64 transition-all"
            />
          </div>
          
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-text-muted hover:text-text-main rounded-full hover:bg-surface-hover transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-background"></span>
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
                  {user ? user.charAt(0).toUpperCase() : '?'}
                </span>
              </div>
              <span className="text-sm font-medium hidden sm:block">
                {user || '未登录'}
              </span>
            </div>
            
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-lg overflow-hidden z-50">
                {user ? (
                  <>
                    <div className="p-4 border-b border-border">
                      <p className="text-xs text-text-muted mb-1">当前登录账号</p>
                      <p className="font-bold text-sm truncate">{user}</p>
                    </div>
                    <div className="p-2">
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
                      登录已有账号
                    </Link>
                    <Link 
                      to="/register"
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors font-medium"
                    >
                      <Edit3 className="w-4 h-4" />
                      注册新账号
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
    </div>
  );
}
