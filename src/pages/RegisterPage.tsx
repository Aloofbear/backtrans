import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Cloud, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isPersistentStorageAvailable } from '../lib/storage';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localProfileName, setLocalProfileName] = useState('');
  const [error, setError] = useState('');
  const [localError, setLocalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { registerAccount, createProfile } = useAuth();
  const storageAvailable = isPersistentStorageAvailable();

  const handleCloudCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致。');
      return;
    }

    setIsLoading(true);
    try {
      await registerAccount({
        username: username.trim(),
        displayName: displayName.trim() || username.trim(),
        password,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || '注册失败，请稍后重试。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocalCreate = (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError('');

    const trimmed = localProfileName.trim();
    if (!trimmed) {
      setLocalError('请输入档案名称');
      return;
    }

    createProfile(trimmed);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background px-6 py-12 text-text-main">
      <div className="mx-auto max-w-5xl">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2 text-text-muted transition-colors hover:text-text-main">
          <ArrowLeft className="h-4 w-4" /> 返回首页
        </Link>

        <div className="mb-8 text-center">
          <div className="mb-3 text-2xl font-bold tracking-tight">BackTrans</div>
          <h1 className="text-3xl font-extrabold">创建学习账号</h1>
          <p className="mt-3 text-sm leading-relaxed text-text-muted">
            云端账号用于跨设备保存回译记录、错题本和收藏表达。
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <form onSubmit={handleCloudCreate} className="rounded-2xl border border-border bg-surface p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Cloud className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">云端账号</h2>
                <p className="text-sm text-text-muted">用户名唯一，可多设备登录</p>
              </div>
            </div>

            <label htmlFor="username" className="block text-sm font-medium">
              用户名
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={event => setUsername(event.target.value)}
              autoComplete="username"
              placeholder="3-40 位英文、数字或符号"
              className="mt-2 block w-full rounded-lg border border-border bg-background px-3 py-2.5 outline-none transition-colors focus:border-primary"
            />

            <label htmlFor="displayName" className="mt-4 block text-sm font-medium">
              昵称
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={event => setDisplayName(event.target.value)}
              autoComplete="nickname"
              placeholder="例如：Aloofbear"
              className="mt-2 block w-full rounded-lg border border-border bg-background px-3 py-2.5 outline-none transition-colors focus:border-primary"
            />

            <label htmlFor="password" className="mt-4 block text-sm font-medium">
              密码
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={event => setPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="至少 8 位"
              className="mt-2 block w-full rounded-lg border border-border bg-background px-3 py-2.5 outline-none transition-colors focus:border-primary"
            />

            <label htmlFor="confirmPassword" className="mt-4 block text-sm font-medium">
              确认密码
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={event => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="再次输入密码"
              className="mt-2 block w-full rounded-lg border border-border bg-background px-3 py-2.5 outline-none transition-colors focus:border-primary"
            />

            {error && <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-background transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              <UserPlus className="h-4 w-4" />
              {isLoading ? '创建中...' : '创建云端账号'}
            </button>

            <Link
              to="/login"
              className="mt-4 flex w-full justify-center rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface-hover"
            >
              已有账号，去登录
            </Link>
          </form>

          <form onSubmit={handleLocalCreate} className="rounded-2xl border border-border bg-surface p-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold">本地档案</h2>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                {storageAvailable
                  ? '本地档案不会上传，适合临时试用。'
                  : '当前浏览器限制本地存储，档案可能无法长期保留。'}
              </p>
            </div>

            <label htmlFor="localProfileName" className="block text-sm font-medium">
              档案名称
            </label>
            <input
              id="localProfileName"
              type="text"
              value={localProfileName}
              onChange={event => setLocalProfileName(event.target.value)}
              placeholder="例如：我的英文训练"
              className="mt-2 block w-full rounded-lg border border-border bg-background px-3 py-2.5 outline-none transition-colors focus:border-primary"
            />

            {localError && <div className="mt-3 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{localError}</div>}

            <button
              type="submit"
              className="mt-5 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-bold transition-colors hover:border-primary/50"
            >
              创建本地档案
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
