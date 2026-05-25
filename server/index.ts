import express from 'express';
import * as dotenv from 'dotenv';
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const app = express();
const port = Number(process.env.PORT || 8787);
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(rootDir, 'dist');
const analyticsDir = cleanEnvValue(process.env.ANALYTICS_DIR) || path.join(rootDir, 'data');
const analyticsEventsPath = path.join(analyticsDir, 'events.jsonl');
const appDbPath = cleanEnvValue(process.env.APP_DB_PATH) || path.join(analyticsDir, 'backtrans.db');
const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite') as { DatabaseSync: new (filename: string) => any };

app.use(express.json({ limit: '1mb' }));

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

app.use((req, res, next) => {
  const configuredOrigins = (process.env.APP_ORIGIN ?? '')
    .split(',')
    .map(asHeaderSafeOrigin)
    .filter((origin): origin is string => Boolean(origin));
  const requestOrigin = Array.isArray(req.headers.origin) ? req.headers.origin[0] : req.headers.origin;
  const safeRequestOrigin = asHeaderSafeOrigin(requestOrigin);
  const allowedOrigin =
    configuredOrigins.find((origin) => origin === safeRequestOrigin || origin === '*') ??
    configuredOrigins[0] ??
    safeRequestOrigin ??
    '*';

  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  if (allowedOrigin !== '*') {
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

function buildPrompt() {
  return `You are a senior bilingual English writing coach for Chinese-native learners.
Return JSON only. Do not use Markdown.

Task:
- Evaluate the user's English back-translation against the Chinese source and the official English reference.
- The source may mention products, AI, ads, healthcare, politics, or business. Treat those topics only as translation context.
- Do NOT evaluate, summarize, praise, criticize, or give advice about the product, company, industry, article topic, or factual content.
- Every field must be about the user's English translation: meaning accuracy, omitted details, grammar, word choice, collocation, sentence structure, discourse flow, and native naturalness.
- If you mention a domain term, mention it only because the user translated that term well or poorly.

The JSON schema:
{
  "overallScore": number from 0 to 100,
  "dimensions": {
    "accuracy": number from 0 to 100,
    "grammar": number from 0 to 100,
    "vocabulary": number from 0 to 100,
    "naturalness": number from 0 to 100
  },
  "summary": "Chinese summary",
  "strengths": ["Chinese bullet"],
  "issues": [
    {
      "title": "Chinese short title",
      "severity": "low|medium|high",
      "userText": "quote from user's translation when useful",
      "suggestion": "better English expression",
      "explanation": "Chinese explanation"
    }
  ],
  "nativeExpressions": [
    { "expression": "English expression", "meaning": "Chinese meaning", "reason": "Chinese reason" }
  ],
  "vocabulary": [
    { "expression": "English word or phrase", "meaning": "Chinese meaning" }
  ],
  "nextSteps": ["Chinese actionable practice step"]
}

Scoring should be strict and useful. Issues must be concrete translation/writing issues. Native expressions and vocabulary should come from the official English reference or a better translation of the user's wording.`;
}

function buildUserMessage(input: { chinese: unknown; english: unknown; userTranslation: unknown }) {
  return [
    'Evaluate this back-translation submission. Return JSON only.',
    '<chinese_source>',
    String(input.chinese),
    '</chinese_source>',
    '<official_english_reference>',
    String(input.english),
    '</official_english_reference>',
    '<user_english_translation_to_evaluate>',
    String(input.userTranslation),
    '</user_english_translation_to_evaluate>',
    'Do not analyze the article topic or product content. Analyze only how well the user translated it into English.',
  ].join('\n');
}

function extractJson(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) return JSON.parse(trimmed);

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return JSON.parse(fenced[1]);

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
  }

  throw new Error('Model response did not contain JSON.');
}

type AnalyticsEvent = {
  id: string;
  event: string;
  timestamp: string;
  receivedAt: string;
  sessionId: string;
  userId: string;
  path: string;
  referrer?: string;
  source: string;
  userAgent?: string;
  visitorHash: string;
  properties: Record<string, unknown>;
};

function sanitizeString(value: unknown, maxLength = 180) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function sanitizeProperties(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result: Record<string, unknown> = {};

  Object.entries(value as Record<string, unknown>).forEach(([key, rawValue]) => {
    if (!/^[a-zA-Z0-9_.-]{1,64}$/.test(key)) return;
    if (/translation|source|english|chinese|text|content/i.test(key)) return;

    if (typeof rawValue === 'string') {
      result[key] = rawValue.slice(0, 160);
      return;
    }
    if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
      result[key] = Math.round(rawValue * 100) / 100;
      return;
    }
    if (typeof rawValue === 'boolean') {
      result[key] = rawValue;
      return;
    }
    if (rawValue === null) {
      result[key] = null;
      return;
    }
    if (Array.isArray(rawValue)) {
      result[key] = rawValue
        .filter(item => ['string', 'number', 'boolean'].includes(typeof item))
        .slice(0, 12);
    }
  });

  return result;
}

type AuthUser = {
  id: string;
  username: string;
  displayName: string;
  role: 'admin' | 'user';
};

type SessionUser = AuthUser & {
  sessionId: string;
};

let appDb: any;

function getDb() {
  if (appDb) return appDb;

  fs.mkdirSync(path.dirname(appDbPath), { recursive: true });
  appDb = new DatabaseSync(appDbPath);
  appDb.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      device_name TEXT,
      created_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS user_data (
      user_id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
  `);
  ensureInitialAdmin();
  return appDb;
}

function normalizeUsername(value: unknown) {
  const username = sanitizeString(value, 40).toLowerCase();
  if (!/^[a-z0-9_.@-]{3,40}$/.test(username)) {
    throw new Error('用户名需为 3-40 位，可使用英文、数字、点、下划线、短横线或 @。');
  }
  return username;
}

function normalizeConfiguredUsername(value: unknown) {
  try {
    return normalizeUsername(value);
  } catch {
    return '';
  }
}

function validatePassword(value: unknown) {
  if (typeof value !== 'string' || value.length < 8 || value.length > 72) {
    throw new Error('密码需为 8-72 位。');
  }
  return value;
}

function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  const passwordHash = scryptSync(password, salt, 64).toString('hex');
  return { passwordHash, passwordSalt: salt };
}

function verifyPassword(password: string, row: any) {
  const expected = Buffer.from(String(row.password_hash || ''), 'hex');
  const actual = scryptSync(password, String(row.password_salt || ''), 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function parseCookies(req: express.Request) {
  const cookieHeader = Array.isArray(req.headers.cookie) ? req.headers.cookie[0] : req.headers.cookie;
  return Object.fromEntries(
    String(cookieHeader || '')
      .split(';')
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => {
        const separator = part.indexOf('=');
        const key = separator >= 0 ? part.slice(0, separator) : part;
        const value = separator >= 0 ? part.slice(separator + 1) : '';
        return [key, decodeURIComponent(value)];
      })
  );
}

function getSessionCookieName() {
  return cleanEnvValue(process.env.SESSION_COOKIE_NAME) || 'backtrans_session';
}

function isSecureRequest(req: express.Request) {
  const proto = Array.isArray(req.headers['x-forwarded-proto']) ? req.headers['x-forwarded-proto'][0] : req.headers['x-forwarded-proto'];
  return req.secure || proto === 'https';
}

function setSessionCookie(req: express.Request, res: express.Response, token: string, expiresAt: string) {
  const maxAge = Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000));
  const parts = [
    `${getSessionCookieName()}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (isSecureRequest(req)) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(res: express.Response) {
  res.setHeader('Set-Cookie', `${getSessionCookieName()}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

function mapAuthUser(row: any): AuthUser {
  return {
    id: String(row.id),
    username: String(row.username),
    displayName: String(row.display_name ?? row.displayName ?? row.username),
    role: row.role === 'admin' ? 'admin' : 'user',
  };
}

function countUsers() {
  return Number(getDb().prepare('SELECT COUNT(*) AS count FROM users').get()?.count || 0);
}

function adminExists() {
  return Boolean(getDb().prepare("SELECT 1 FROM users WHERE role = 'admin' LIMIT 1").get());
}

function chooseRoleForNewUser(username: string): 'admin' | 'user' {
  const configuredAdmin = normalizeConfiguredUsername(process.env.ADMIN_USERNAME);
  if (configuredAdmin) {
    return username === configuredAdmin && !adminExists() ? 'admin' : 'user';
  }
  return countUsers() === 0 ? 'admin' : 'user';
}

function ensureInitialAdmin() {
  const username = normalizeConfiguredUsername(process.env.ADMIN_USERNAME);
  const password = cleanEnvValue(process.env.ADMIN_INITIAL_PASSWORD);
  if (!appDb || !username || !password) return;

  const displayName = sanitizeString(process.env.ADMIN_DISPLAY_NAME, 40) || username;
  const existing = appDb.prepare('SELECT * FROM users WHERE username = ?').get(username);
  const now = new Date().toISOString();

  if (existing) {
    if (existing.role !== 'admin') {
      appDb.prepare("UPDATE users SET role = 'admin', updated_at = ? WHERE id = ?").run(now, existing.id);
    }
    return;
  }

  const { passwordHash, passwordSalt } = hashPassword(password);
  appDb.prepare(`
    INSERT INTO users (id, username, display_name, password_hash, password_salt, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'admin', ?, ?)
  `).run(randomUUID(), username, displayName, passwordHash, passwordSalt, now, now);
}

function createSession(userId: string, req: express.Request) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const token = randomBytes(32).toString('base64url');
  const userAgent = Array.isArray(req.headers['user-agent']) ? req.headers['user-agent'][0] : req.headers['user-agent'];
  const deviceName = sanitizeString(req.body?.deviceName, 80) || sanitizeString(userAgent, 80) || 'web';

  getDb().prepare(`
    INSERT INTO sessions (id, user_id, token_hash, device_name, created_at, last_seen_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(randomUUID(), userId, tokenHash(token), deviceName, now.toISOString(), now.toISOString(), expiresAt);

  return { token, expiresAt };
}

function getCurrentSessionUser(req: express.Request): SessionUser | null {
  const token = parseCookies(req)[getSessionCookieName()];
  if (!token) return null;

  const db = getDb();
  const row = db.prepare(`
    SELECT
      sessions.id AS session_id,
      sessions.expires_at,
      users.id,
      users.username,
      users.display_name,
      users.role
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ?
  `).get(tokenHash(token));

  if (!row) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(row.session_id);
    return null;
  }

  db.prepare('UPDATE sessions SET last_seen_at = ? WHERE id = ?').run(new Date().toISOString(), row.session_id);
  return { ...mapAuthUser(row), sessionId: String(row.session_id) };
}

function requireSession(req: express.Request, res: express.Response) {
  const user = getCurrentSessionUser(req);
  if (!user) {
    res.status(401).json({ error: '请先登录云端账号。' });
    return null;
  }
  return user;
}

function sanitizeUserDataPayload(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const serialized = JSON.stringify(value);
  if (Buffer.byteLength(serialized, 'utf8') > 512 * 1024) {
    throw new Error('同步数据过大，请先清理本地学习记录。');
  }
  return JSON.parse(serialized);
}

function getClientIp(req: express.Request) {
  const forwarded = req.headers['x-forwarded-for'];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return sanitizeString(value?.split(',')[0] || req.socket.remoteAddress || 'unknown', 80);
}

function getVisitorHash(req: express.Request) {
  const salt = cleanEnvValue(process.env.ANALYTICS_SALT) || 'backtrans-analytics';
  const day = new Date().toISOString().slice(0, 10);
  const userAgent = Array.isArray(req.headers['user-agent']) ? req.headers['user-agent'][0] : req.headers['user-agent'];
  return createHash('sha256')
    .update(`${getClientIp(req)}|${sanitizeString(userAgent, 240)}|${day}|${salt}`)
    .digest('hex')
    .slice(0, 20);
}

function normalizeAnalyticsEvent(req: express.Request) {
  const body = req.body ?? {};
  const event = sanitizeString(body.event, 80);

  if (!/^[a-z][a-z0-9_]{1,79}$/.test(event)) {
    throw new Error('Invalid event name.');
  }

  const timestamp = new Date(body.timestamp || Date.now());
  const safeTimestamp = Number.isNaN(timestamp.getTime()) ? new Date() : timestamp;
  const userAgent = Array.isArray(req.headers['user-agent']) ? req.headers['user-agent'][0] : req.headers['user-agent'];

  return {
    id: randomUUID(),
    event,
    timestamp: safeTimestamp.toISOString(),
    receivedAt: new Date().toISOString(),
    sessionId: sanitizeString(body.sessionId, 96) || 'anonymous-session',
    userId: sanitizeString(body.userId, 96) || 'guest',
    path: sanitizeString(body.path, 220) || '/',
    referrer: sanitizeString(body.referrer, 260) || undefined,
    source: sanitizeString(body.source, 80) || 'web',
    userAgent: sanitizeString(userAgent, 240) || undefined,
    visitorHash: getVisitorHash(req),
    properties: sanitizeProperties(body.properties),
  } satisfies AnalyticsEvent;
}

function isAnalyticsAdmin(req: express.Request) {
  const token = cleanEnvValue(process.env.ANALYTICS_ADMIN_TOKEN);
  const authHeader = Array.isArray(req.headers.authorization) ? req.headers.authorization[0] : req.headers.authorization;
  const bearerToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  const queryToken = typeof req.query.adminToken === 'string' ? req.query.adminToken.trim() : '';
  if (token && (bearerToken === token || queryToken === token)) return true;
  return getCurrentSessionUser(req)?.role === 'admin';
}

function appendAnalyticsEvent(event: AnalyticsEvent) {
  fs.mkdirSync(analyticsDir, { recursive: true });
  fs.appendFileSync(analyticsEventsPath, `${JSON.stringify(event)}\n`, 'utf8');
}

function readAnalyticsEvents(days: number) {
  if (!fs.existsSync(analyticsEventsPath)) return [] as AnalyticsEvent[];

  const safeDays = Math.max(1, Math.min(365, Math.round(days || 30)));
  const since = Date.now() - safeDays * 24 * 60 * 60 * 1000;

  return fs.readFileSync(analyticsEventsPath, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map(line => {
      try {
        return JSON.parse(line) as AnalyticsEvent;
      } catch {
        return null;
      }
    })
    .filter((event): event is AnalyticsEvent => Boolean(event) && new Date(event.timestamp).getTime() >= since);
}

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
}

function summarizeAnalytics(days: number) {
  const events = readAnalyticsEvents(days);
  const countByEvent: Record<string, number> = {};
  const daily: Record<string, { date: string; events: number; sessions: Set<string>; submits: number }> = {};
  const bySession = new Map<string, Set<string>>();
  const corpusCounts: Record<string, { corpusId: string; count: number; submissions: number; feedbackSuccess: number }> = {};
  const latencies: number[] = [];

  events.forEach(event => {
    countByEvent[event.event] = (countByEvent[event.event] || 0) + 1;
    const sessionKey = event.sessionId || event.visitorHash;
    if (!bySession.has(sessionKey)) bySession.set(sessionKey, new Set());
    bySession.get(sessionKey)?.add(event.event);

    const date = event.timestamp.slice(0, 10);
    if (!daily[date]) daily[date] = { date, events: 0, sessions: new Set(), submits: 0 };
    daily[date].events += 1;
    daily[date].sessions.add(sessionKey);
    if (event.event === 'translation_submit' || event.event === 'review_submit') daily[date].submits += 1;

    const corpusId = String(event.properties?.corpusId ?? '');
    if (corpusId) {
      if (!corpusCounts[corpusId]) corpusCounts[corpusId] = { corpusId, count: 0, submissions: 0, feedbackSuccess: 0 };
      corpusCounts[corpusId].count += 1;
      if (event.event === 'translation_submit') corpusCounts[corpusId].submissions += 1;
      if (event.event === 'ai_feedback_success') corpusCounts[corpusId].feedbackSuccess += 1;
    }

    const durationMs = Number(event.properties?.durationMs);
    if (event.event === 'ai_feedback_success' && Number.isFinite(durationMs)) latencies.push(durationMs);
  });

  const sessionsWith = (eventName: string) => Array.from(bySession.values()).filter(eventsInSession => eventsInSession.has(eventName)).length;
  const pageViewSessions = sessionsWith('page_view') || bySession.size;
  const practiceStartSessions = sessionsWith('practice_start');
  const submitSessions = sessionsWith('translation_submit');
  const aiSuccessSessions = sessionsWith('ai_feedback_success');
  const reviewSubmitSessions = sessionsWith('review_submit');

  return {
    generatedAt: new Date().toISOString(),
    days,
    totals: {
      events: events.length,
      sessions: bySession.size,
      visitors: new Set(events.map(event => event.visitorHash)).size,
      identifiedUsers: new Set(events.map(event => event.userId).filter(userId => userId && userId !== 'guest')).size,
    },
    funnel: {
      pageViewSessions,
      practiceStartSessions,
      submitSessions,
      aiSuccessSessions,
      reviewSubmitSessions,
      startRate: percent(practiceStartSessions, pageViewSessions),
      submitRate: percent(submitSessions, practiceStartSessions),
      aiSuccessRate: percent(aiSuccessSessions, submitSessions + reviewSubmitSessions),
      feedbackExpandRate: percent(sessionsWith('feedback_expand'), aiSuccessSessions),
      favoriteRate: percent(sessionsWith('expression_favorite'), aiSuccessSessions),
      reviewUsageRate: percent(reviewSubmitSessions, pageViewSessions),
    },
    ai: {
      success: countByEvent.ai_feedback_success || 0,
      failed: countByEvent.ai_feedback_failed || 0,
      averageLatencyMs: latencies.length ? Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length) : 0,
    },
    countByEvent,
    daily: Object.values(daily)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(item => ({ date: item.date, events: item.events, sessions: item.sessions.size, submits: item.submits })),
    topCorpus: Object.values(corpusCounts)
      .sort((a, b) => b.submissions - a.submissions || b.count - a.count)
      .slice(0, 10),
  };
}

app.get('/api/health', (_req, res) => {
  getDb();
  res.json({
    ok: true,
    aiConfigured: Boolean(cleanEnvValue(process.env.DEEPSEEK_API_KEY)),
    accountsConfigured: true,
    mode: fs.existsSync(distDir) ? 'fullstack' : 'api-only',
  });
});

app.get('/api/auth/me', (req, res) => {
  const user = getCurrentSessionUser(req);
  res.json(user ? { authenticated: true, user: mapAuthUser(user) } : { authenticated: false, user: null });
});

app.post('/api/auth/register', (req, res) => {
  try {
    const username = normalizeUsername(req.body?.username);
    const password = validatePassword(req.body?.password);
    const displayName = sanitizeString(req.body?.displayName, 40) || username;
    const role = chooseRoleForNewUser(username);
    const now = new Date().toISOString();
    const { passwordHash, passwordSalt } = hashPassword(password);
    const userId = randomUUID();

    getDb().prepare(`
      INSERT INTO users (id, username, display_name, password_hash, password_salt, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, username, displayName, passwordHash, passwordSalt, role, now, now);

    const session = createSession(userId, req);
    setSessionCookie(req, res, session.token, session.expiresAt);
    res.status(201).json({ authenticated: true, user: { id: userId, username, displayName, role } });
  } catch (error: any) {
    if (String(error?.message || '').includes('UNIQUE')) {
      res.status(409).json({ error: '该用户名已存在，请换一个用户名或直接登录。' });
      return;
    }
    res.status(400).json({ error: error?.message || '注册失败。' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const username = normalizeUsername(req.body?.username);
    const password = validatePassword(req.body?.password);
    const row = getDb().prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!row || !verifyPassword(password, row)) {
      res.status(401).json({ error: '用户名或密码不正确。' });
      return;
    }

    const session = createSession(row.id, req);
    setSessionCookie(req, res, session.token, session.expiresAt);
    res.json({ authenticated: true, user: mapAuthUser(row) });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || '登录失败。' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const user = getCurrentSessionUser(req);
  if (user) {
    getDb().prepare('DELETE FROM sessions WHERE id = ?').run(user.sessionId);
  }
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.get('/api/user-data', (req, res) => {
  const user = requireSession(req, res);
  if (!user) return;

  const row = getDb().prepare('SELECT payload, updated_at FROM user_data WHERE user_id = ?').get(user.id);
  if (!row) {
    res.json({ payload: {}, updatedAt: null });
    return;
  }

  try {
    res.json({ payload: JSON.parse(row.payload), updatedAt: row.updated_at });
  } catch {
    res.json({ payload: {}, updatedAt: row.updated_at });
  }
});

app.put('/api/user-data', (req, res) => {
  const user = requireSession(req, res);
  if (!user) return;

  try {
    const payload = sanitizeUserDataPayload(req.body?.payload ?? req.body ?? {});
    const serialized = JSON.stringify(payload);
    const updatedAt = new Date().toISOString();

    getDb().prepare(`
      INSERT INTO user_data (user_id, payload, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at
    `).run(user.id, serialized, updatedAt);

    res.json({ ok: true, updatedAt });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || '同步失败。' });
  }
});

app.post('/api/events', (req, res) => {
  try {
    const event = normalizeAnalyticsEvent(req);
    appendAnalyticsEvent(event);
    res.status(202).json({ ok: true });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Invalid analytics event.' });
  }
});

app.get('/api/analytics/summary', (req, res) => {
  if (!isAnalyticsAdmin(req)) {
    res.status(401).json({ error: 'Analytics admin token is required.' });
    return;
  }

  const days = Number(req.query.days || 30);
  res.json(summarizeAnalytics(Number.isFinite(days) ? days : 30));
});

app.post('/api/analyze-translation', async (req, res) => {
  const { chinese, english, userTranslation } = req.body ?? {};

  if (!chinese || !english || !userTranslation) {
    res.status(400).json({ error: 'chinese, english and userTranslation are required.' });
    return;
  }

  const apiKey = cleanEnvValue(process.env.DEEPSEEK_API_KEY);
  if (!apiKey) {
    res.status(503).json({ error: 'AI backend is not configured. Set DEEPSEEK_API_KEY on the server.' });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(cleanEnvValue(process.env.DEEPSEEK_API_URL) || 'https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: cleanEnvValue(process.env.DEEPSEEK_MODEL) || 'deepseek-chat',
        temperature: 0.25,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildPrompt() },
          {
            role: 'user',
            content: buildUserMessage({
              chinese,
              english,
              userTranslation,
            }),
          },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      res.status(response.status).json({ error: errorText || `Provider returned ${response.status}` });
      return;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      res.status(502).json({ error: 'Provider response was missing message content.' });
      return;
    }

    res.json({ feedback: extractJson(content) });
  } catch (error: any) {
    clearTimeout(timeout);
    const message = error?.name === 'AbortError' ? 'AI request timed out.' : error?.message || 'AI request failed.';
    res.status(502).json({ error: message });
  }
});

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      next();
      return;
    }
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(port, '0.0.0.0', () => {
  const mode = fs.existsSync(distDir) ? 'app and API' : 'API only';
  console.log(`BackTrans ${mode} listening on http://0.0.0.0:${port}`);
});
