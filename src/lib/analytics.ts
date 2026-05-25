import { readRawStorageItem, writeRawStorageItem } from './storage';

const SESSION_STORAGE_KEY = 'backtransAnalyticsSessionId';
const DEFAULT_ANALYTICS_PROXY = 'https://github-backtrans.vercel.app';

export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined | Array<string | number | boolean>>;

function splitApiBases(value: string | undefined) {
  return (value || '')
    .split(',')
    .map(item => item.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function createId(prefix: string) {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}

export function getAnalyticsSessionId() {
  const existing = readRawStorageItem(SESSION_STORAGE_KEY);
  if (existing) return existing;
  const sessionId = createId('session');
  writeRawStorageItem(SESSION_STORAGE_KEY, sessionId);
  return sessionId;
}

function getRuntimeSource() {
  const host = window.location.hostname;
  if (host.endsWith('github.io')) return 'github_pages';
  if (host.includes('vercel.app')) return 'vercel';
  if (host === '8.163.84.238') return 'ecs';
  if (host === 'localhost' || host === '127.0.0.1') return 'local';
  return 'web';
}

function getApiBaseCandidates() {
  const configured = [
    ...splitApiBases(import.meta.env.VITE_ANALYTICS_API_BASE_URLS),
    ...splitApiBases(import.meta.env.VITE_ANALYTICS_API_BASE_URL),
  ];

  if (window.location.protocol === 'http:') {
    configured.push('');
  } else if (window.location.hostname.includes('vercel.app')) {
    configured.push('');
  } else {
    configured.push(DEFAULT_ANALYTICS_PROXY);
  }

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    configured.push('http://127.0.0.1:8787');
  }

  return Array.from(new Set(configured));
}

function getEndpoint(path: string) {
  return getApiBaseCandidates().map(base => `${base}${path}`);
}

function sanitizeProperties(properties: AnalyticsProperties = {}) {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined)
  );
}

export function trackEvent(event: string, properties: AnalyticsProperties = {}, userId?: string | null) {
  if (typeof window === 'undefined') return;

  const body = {
    event,
    sessionId: getAnalyticsSessionId(),
    userId: userId || 'guest',
    path: `${window.location.pathname}${window.location.hash}`,
    referrer: document.referrer || undefined,
    source: getRuntimeSource(),
    timestamp: new Date().toISOString(),
    properties: sanitizeProperties(properties),
  };

  const payload = JSON.stringify(body);
  const endpoints = getEndpoint('/api/events');

  for (const endpoint of endpoints) {
    try {
      if (navigator.sendBeacon) {
        const sent = navigator.sendBeacon(endpoint, new Blob([payload], { type: 'application/json' }));
        if (sent) return;
      }
    } catch {
      // Fall back to fetch below.
    }

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => undefined);
    return;
  }
}

export async function fetchAnalyticsSummary(days = 30, adminToken = '') {
  const endpoints = getEndpoint(`/api/analytics/summary?days=${days}`);
  const errors: string[] = [];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        credentials: 'include',
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : undefined,
      });
      if (!response.ok) throw new Error(`Request failed with ${response.status}`);
      return response.json();
    } catch (error: any) {
      errors.push(`${endpoint}: ${error?.message || 'unknown error'}`);
    }
  }

  throw new Error(errors.join('; ') || 'Analytics summary is unavailable.');
}
