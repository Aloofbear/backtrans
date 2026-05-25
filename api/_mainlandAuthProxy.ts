export type ApiRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
  on?: (event: string, callback: (...args: any[]) => void) => void;
};

export type ApiResponse = {
  setHeader: (name: string, value: string | string[]) => void;
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

function setCors(req: ApiRequest, res: ApiResponse, methods: string[]) {
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
  res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
  if (allowedOrigin !== '*') {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
}

function parseJsonLikeBody(body: unknown) {
  if (Buffer.isBuffer(body)) {
    return parseJsonLikeBody(body.toString('utf8'));
  }
  if (typeof body !== 'string') return body;
  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
}

async function parseRequestBody(req: ApiRequest) {
  const parsedBody = parseJsonLikeBody(req.body);
  if (parsedBody && typeof parsedBody === 'object') return parsedBody;

  if (typeof req.on !== 'function') return {};

  const rawBody = await new Promise<string>((resolve, reject) => {
    let data = '';
    req.on?.('data', chunk => {
      data += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
    });
    req.on?.('end', () => resolve(data));
    req.on?.('error', reject);
  });

  return parseJsonLikeBody(rawBody);
}

function getMainlandApiBase() {
  const configured = cleanEnvValue(process.env.MAINLAND_API_BASE_URL);
  if (configured === 'disabled') return undefined;
  return (configured || DEFAULT_MAINLAND_API_BASE).replace(/\/$/, '');
}

function getHeader(req: ApiRequest, name: string) {
  const value = req.headers[name] ?? req.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function relaySetCookie(response: Response, res: ApiResponse) {
  const normalizeCookie = (cookie: string) => {
    let next = cookie.replace(/;\s*SameSite=Lax/i, '; SameSite=None');
    if (!/;\s*Secure/i.test(next)) next += '; Secure';
    return next;
  };
  const getSetCookie = (response.headers as any).getSetCookie?.bind(response.headers);
  const cookies = getSetCookie ? getSetCookie() : response.headers.get('set-cookie');
  if (Array.isArray(cookies) && cookies.length > 0) {
    res.setHeader('Set-Cookie', cookies.map(normalizeCookie));
  } else if (typeof cookies === 'string' && cookies) {
    res.setHeader('Set-Cookie', normalizeCookie(cookies));
  }
}

export async function proxyMainlandRequest(req: ApiRequest, res: ApiResponse, path: string, methods: string[]) {
  setCors(req, res, [...methods, 'OPTIONS']);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (!req.method || !methods.includes(req.method)) {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const apiBase = getMainlandApiBase();
  if (!apiBase) {
    res.status(503).json({ error: 'Mainland API upstream is disabled.' });
    return;
  }

  const headers: Record<string, string> = {};
  const cookie = getHeader(req, 'cookie');
  const authorization = getHeader(req, 'authorization');
  if (cookie) headers.Cookie = cookie;
  if (authorization) headers.Authorization = authorization;

  const options: RequestInit = { method: req.method, headers };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(await parseRequestBody(req));
  }

  const response = await fetch(`${apiBase}${path}`, options);
  relaySetCookie(response, res);
  res.status(response.status).json(await response.json());
}
