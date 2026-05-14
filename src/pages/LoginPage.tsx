import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [profileName, setProfileName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { profiles, login, createProfile, refreshProfiles } = useAuth();

  useEffect(() => {
    refreshProfiles();
  }, [refreshProfiles]);

  const handleEnter = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = profileName.trim();
    if (!trimmed) {
      setError('请输入本地学习档案名称');
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
      <div className="mx-auto max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2 text-text-muted transition-colors hover:text-text-main">
          <ArrowLeft className="h-4 w-4" /> 返回首页
        </Link>

        <div className="mb-8 text-center">
          <div className="mb-3 text-2xl font-bold tracking-tight">BackTrans</div>
          <h1 className="text-3xl font-extrabold">进入本地学习档案</h1>
          <p className="mt-3 text-sm leading-relaxed text-text-muted">
            当前版本使用本地档案保存学习记录，不保存真实账号密码，也不会跨设备同步。
          </p>
        </div>

        <div className="mb-6 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm leading-relaxed text-text-main">
          清理浏览器数据会删除本地档案。需要跨设备同步时，请先接入后端账号系统。
        </div>

        {profiles.length > 0 && (
          <div className="mb-6 rounded-2xl border border-border bg-surface p-4">
            <div className="mb-3 text-sm font-bold text-text-muted">已有档案</div>
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

        <form onSubmit={handleEnter} className="rounded-2xl border border-border bg-surface p-6">
          <label htmlFor="profileName" className="block text-sm font-medium">
            新建或进入档案
          </label>
          <input
            id="profileName"
            type="text"
            value={profileName}
            onChange={(event) => setProfileName(event.target.value)}
            placeholder="例如：Aloofbear"
            className="mt-2 block w-full rounded-lg border border-border bg-background px-3 py-2.5 outline-none transition-colors focus:border-primary"
          />

          {error && <div className="mt-3 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>}

          <button
            type="submit"
            className="mt-5 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-background transition-colors hover:bg-primary-hover"
          >
            进入学习
          </button>
        </form>
      </div>
    </div>
  );
}
