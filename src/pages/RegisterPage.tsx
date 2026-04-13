import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('用户名和密码不能为空');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.find((u: any) => u.username === username)) {
      setError('用户名已存在，请换一个');
      return;
    }
    
    // Save new user
    users.push({ username, password });
    localStorage.setItem('users', JSON.stringify(users));
    
    // Auto login
    login(username);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6 text-text-muted hover:text-text-main transition-colors">
          <ArrowLeft className="w-4 h-4" /> 返回首页
        </Link>
        <div className="flex justify-center items-center gap-2 mb-6">
          <div className="bg-primary text-background font-bold px-2 py-1 rounded text-sm">A文</div>
          <span className="font-bold text-2xl tracking-tight text-text-main">BackTrans</span>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-text-main">
          创建新账号
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 mb-6 flex items-start gap-3">
          <div className="text-warning mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <div className="text-sm text-text-main">
            <strong>重要提示：</strong> 由于当前技术及规模限制，需要用户自定义账号。请务必牢记您的账号和密码，否则将面临历史记录丢失的风险。
          </div>
        </div>
        <div className="bg-surface py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-border">
          <form className="space-y-6" onSubmit={handleRegister}>
            {error && (
              <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-text-main">
                用户名
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-border rounded-lg shadow-sm placeholder-text-muted focus:outline-none focus:ring-primary focus:border-primary bg-background text-text-main sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-main">
                密码
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-border rounded-lg shadow-sm placeholder-text-muted focus:outline-none focus:ring-primary focus:border-primary bg-background text-text-main sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-main">
                确认密码
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-border rounded-lg shadow-sm placeholder-text-muted focus:outline-none focus:ring-primary focus:border-primary bg-background text-text-main sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-background bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                注册
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-surface text-text-muted">
                  已有账号？
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="w-full flex justify-center py-2.5 px-4 border border-border rounded-lg shadow-sm text-sm font-medium text-text-main bg-background hover:bg-surface-hover transition-colors"
              >
                直接登录
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
