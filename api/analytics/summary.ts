type ApiRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
  end: () => void;
};

const DEFAULT_MAINLAND_API_BASE = 'http://8.163.84.238:8787';

function cleanEnvValue(value: string | undefined) {
  return value?.replace(/^\uFEFF/, '').trim();
}

function asHeaderSafeOrigin(origin: string | undefined) {
  const cleaned = cleanEnvValue(origin);
  if (!cleaned) return undefined;
  if (cleaned === '*') return cleaned;
  if (!/^https?:\/\/[^\s,]+$/i.test(cleaned)) return undefined;
  return cleaned;
}

function setCors(req: ApiRequest, res: ApiResponse) {
  const requestOrigin = Array.isArray(req.headers.origin) ? req.headers.origin[0] : req.headers.origin;
  const configuredOrigins = (process.env.APP_ORIGIN ?? '')
    .split(',')
    .map(asHeaderSafeOrigin)
    .filter((origin): origin is string => Boolean(origin));
  const safeRequestOrigin = asHeaderSafeOrigin(requestOrigin);
  const allowedOrigin =
    configuredOrigins.find((origin) => origin === safeRequestOrigin || origin === '*') ??
    configuredOrigins[0] ??
    safeRequestOrigin ??
    '*';

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
}

function getMainlandApiBase() {
  const configured = cleanEnvValue(process.env.MAINLAND_API_BASE_URL);
  if (configured === 'disabled') return undefined;
  return (configured || DEFAULT_MAINLAND_API_BASE).replace(/\/$/, '');
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const apiBase = getMainlandApiBase();
  if (!apiBase) {
    res.status(503).json({ error: 'Analytics upstream is disabled.' });
    return;
  }

  const rawDays = Array.isArray(req.query?.days) ? req.query?.days[0] : req.query?.days;
  const days = encodeURIComponent(rawDays || '30');
  const response = await fetch(`${apiBase}/api/analytics/summary?days=${days}`);
  res.status(response.status).json(await response.json());
}
