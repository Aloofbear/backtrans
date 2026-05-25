const DEFAULT_MAINLAND_API_BASE = 'http://8.163.84.238:8787';
const DEFAULT_AUTH_PROXY = 'https://github-backtrans.vercel.app';

export type CloudUser = {
  id: string;
  username: string;
  displayName: string;
  role: 'admin' | 'user';
};

type AuthResponse = {
  authenticated: boolean;
  user: CloudUser | null;
};

function splitApiBases(value: string | undefined) {
  return (value || '')
    .split(',')
    .map(item => item.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function getAuthApiBaseCandidates() {
  const configured = [
    ...splitApiBases(import.meta.env.VITE_AUTH_API_BASE_URLS),
    ...splitApiBases(import.meta.env.VITE_AUTH_API_BASE_URL),
  ];

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    configured.push('http://127.0.0.1:8787');
  }

  if (window.location.protocol === 'http:' || window.location.hostname.includes('vercel.app')) {
    configured.push('');
  }

  if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    configured.push(DEFAULT_MAINLAND_API_BASE);
  }

  if (window.location.hostname.endsWith('github.io')) {
    configured.push(DEFAULT_AUTH_PROXY);
  }

  return Array.from(new Set(configured));
}

async function readErrorMessage(response: Response) {
  try {
    const data = await response.json();
    return data?.error || `请求失败：${response.status}`;
  } catch {
    return `请求失败：${response.status}`;
  }
}

async function authFetch<T>(path: string, options: RequestInit = {}) {
  const endpoints = getAuthApiBaseCandidates().map(base => `${base}${path}`);
  const errors: string[] = [];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        ...options,
        credentials: 'include',
        headers: {
          ...(options.body ? { 'Content-Type': 'application/json' } : {}),
          ...(options.headers || {}),
        },
      });

      if (!response.ok) throw new Error(await readErrorMessage(response));
      return response.json() as Promise<T>;
    } catch (error: any) {
      errors.push(error?.message || '请求失败');
    }
  }

  throw new Error(errors[0] || '账号服务暂时不可用。');
}

export function fetchCurrentCloudUser() {
  return authFetch<AuthResponse>('/api/auth/me');
}

export function loginCloudAccount(input: { username: string; password: string }) {
  return authFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function registerCloudAccount(input: { username: string; password: string; displayName: string }) {
  return authFetch<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function logoutCloudAccount() {
  return authFetch<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
}

export function fetchCloudLearningData() {
  return authFetch<{ payload: Record<string, unknown>; updatedAt: string | null }>('/api/user-data');
}

export function saveCloudLearningData(payload: Record<string, unknown>) {
  return authFetch<{ ok: boolean; updatedAt: string }>('/api/user-data', {
    method: 'PUT',
    body: JSON.stringify({ payload }),
  });
}
