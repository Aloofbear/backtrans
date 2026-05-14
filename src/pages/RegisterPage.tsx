import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const [profileName, setProfileName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { createProfile } = useAuth();

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const trimmed = profileName.trim();
    if (!trimmed) {
      setError('请输入档案名称');
      return;
    }

    createProfile(trimmed);
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
          <h1 className="text-3xl font-extrabold">创建本地学习档案</h1>
          <p className="mt-3 text-sm leading-relaxed text-text-muted">
            用一个名称区分学习记录即可。当前版本不需要密码，也不会上传你的档案数据。
          </p>
        </div>

        <div className="mb-6 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm leading-relaxed">
          本地档案适合个人练习和原型阶段。正式上线前应接入真实认证、云端同步、隐私授权和数据导出能力。
        </div>

        <form onSubmit={handleCreate} className="rounded-2xl border border-border bg-surface p-6">
          <label htmlFor="profileName" className="block text-sm font-medium">
            档案名称
          </label>
          <input
            id="profileName"
            type="text"
            required
            value={profileName}
            onChange={(event) => setProfileName(event.target.value)}
            placeholder="例如：我的英文训练"
            className="mt-2 block w-full rounded-lg border border-border bg-background px-3 py-2.5 outline-none transition-colors focus:border-primary"
          />

          {error && <div className="mt-3 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>}

          <button
            type="submit"
            className="mt-5 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-background transition-colors hover:bg-primary-hover"
          >
            创建并开始
          </button>

          <Link
            to="/login"
            className="mt-4 flex w-full justify-center rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface-hover"
          >
            选择已有档案
          </Link>
        </form>
      </div>
    </div>
  );
}
