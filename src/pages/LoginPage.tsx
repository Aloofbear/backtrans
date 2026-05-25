import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Cloud, LockKeyhole, UserRound, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isPersistentStorageAvailable } from '../lib/storage';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [profileName, setProfileName] = useState('');
  const [error, setError] = useState('');
  const [localError, setLocalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { profiles, login, createProfile, loginAccount, refreshProfiles } = useAuth();
  const storageAvailable = isPersistentStorageAvailable();

  useEffect(() => {
    refreshProfiles();
  }, [refreshProfiles]);

  const handleCloudLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await loginAccount({ username: username.trim(), password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || '登录失败，请检查账号密码。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocalEnter = (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError('');

    const trimmed = profileName.trim();
    if (!trimmed) {
      setLocalError('请输入本地学习档案名称');
      return;
    }

    createProfile(trimmed);
    navigate('/dashboard');
  };

  const handleSelectProfile = (profileId: string) => {
    login(profileId);
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
          <h1 className="text-3xl font-extrabold">登录学习账号</h1>
          <p className="mt-3 text-sm leading-relaxed text-text-muted">
            云端账号会同步学习记录；本地档案仍可离线使用。
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <form onSubmit={handleCloudLogin} className="rounded-2xl border border-border bg-surface p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Cloud className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">云端账号</h2>
                <p className="text-sm text-text-muted">支持多设备登录和服务端数据保存</p>
              </div>
            </div>

            <label htmlFor="username" className="block text-sm font-medium">
              用户名
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={event => setUsername(event.target.value)}
              autoComplete="username"
              placeholder="例如：aloofbear"
              className="mt-2 block w-full rounded-lg border border-border bg-background px-3 py-2.5 outline-none transition-colors focus:border-primary"
            />

            <label htmlFor="password" className="mt-4 block text-sm font-medium">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="输入密码"
              className="mt-2 block w-full rounded-lg border border-border bg-background px-3 py-2.5 outline-none transition-colors focus:border-primary"
            />

            {error && <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-background transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              <LockKeyhole className="h-4 w-4" />
              {isLoading ? '登录中...' : '登录云端账号'}
            </button>

            <Link
              to="/register"
              className="mt-4 flex w-full justify-center rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface-hover"
            >
              创建云端账号
            </Link>
          </form>

          <div className="space-y-6">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/40 bg-primary/10 px-4 py-4 text-sm font-bold text-primary transition-colors hover:bg-primary/15"
            >
              <Zap className="h-4 w-4" />
              游客模式开始练习
            </button>

            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="mb-4 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm leading-relaxed text-text-main">
                {storageAvailable
                  ? '本地档案只保存在当前浏览器，适合临时练习。'
                  : '当前浏览器限制了本地持久化存储，刷新或关闭页面后可能丢失。'}
              </div>

              {profiles.length > 0 && (
                <div className="mb-5">
                  <div className="mb-3 text-sm font-bold text-text-muted">已有本地档案</div>
                  <div className="space-y-2">
                    {profiles.map(profile => (
                      <button
                        key={profile.id}
                        onClick={() => handleSelectProfile(profile.id)}
                        className="flex w-full items-center gap-3 rounded-xl border border-border bg-background p-3 text-left transition-colors hover:border-primary/50"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary">
                          <UserRound className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-bold">{profile.displayName}</div>
                          <div className="text-xs text-text-muted">上次使用：{new Date(profile.lastActiveAt).toLocaleDateString('zh-CN')}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleLocalEnter}>
                <label htmlFor="profileName" className="block text-sm font-medium">
                  新建本地档案
                </label>
                <input
                  id="profileName"
                  type="text"
                  value={profileName}
                  onChange={event => setProfileName(event.target.value)}
                  placeholder="例如：我的英文训练"
                  className="mt-2 block w-full rounded-lg border border-border bg-background px-3 py-2.5 outline-none transition-colors focus:border-primary"
                />

                {localError && <div className="mt-3 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{localError}</div>}

                <button
                  type="submit"
                  className="mt-4 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-bold transition-colors hover:border-primary/50"
                >
                  进入本地档案
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
