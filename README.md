# BackTrans

BackTrans is an English back-translation practice app for Chinese-native learners who want to improve natural written expression. It combines long-form back-translation, short sentence drills, structured feedback, local learning records, and a review queue.

Live demo: https://github-backtrans.vercel.app/

GitHub Pages mirror: https://aloofbear.github.io/backtrans/

## Product Focus

- Practice Chinese-to-English output against polished native English references.
- Receive structured feedback on accuracy, grammar, vocabulary, and naturalness.
- Save important expressions into a review queue instead of a simple bookmark list.
- Use low-cost cloud accounts for cross-device learning records, while preserving local guest profiles for trial use.

## Current Architecture

- Frontend: React, Vite, Tailwind CSS, React Router.
- AI proxy: Vercel serverless API routes in `api/` for production, plus `server/index.ts` as a local development proxy.
- Persistence: SQLite-backed accounts, sessions, and synced learning records on the Node/ECS server; browser `localStorage` remains as the immediate client cache and guest mode.
- Product analytics: first-party event tracking through `/api/events`, stored on the ECS/Node server as `data/events.jsonl`, with a built-in `/analytics` dashboard.
- Static hosting: GitHub Pages can serve the app, but AI feedback requires a deployed API proxy.

## Local Development

Prerequisites: Node.js 24+ and npm.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` from `.env.example`.

3. Start the AI proxy in one terminal:

   ```bash
   npm run dev:api
   ```

4. Start the frontend in another terminal:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000`.

Vite proxies `/api` to `http://localhost:8787` in local development. If you do not start the local API proxy, set the frontend to use the Vercel API:

```bash
VITE_API_BASE_URL="https://github-backtrans.vercel.app"
VITE_API_BASE_URLS="https://api.your-domain.cn,https://github-backtrans.vercel.app"
APP_ORIGIN="http://localhost:3000"
DEEPSEEK_API_KEY="your-server-side-key"
```

## Security Notes

Never put AI provider keys in `VITE_*` variables. Vite exposes those values to the browser bundle.

The frontend no longer calls DeepSeek directly. It calls `/api/analyze-translation`, and the server forwards the request with the server-side `DEEPSEEK_API_KEY`.

If the API proxy is not reachable, the app falls back to a local diagnostic mode so static demos remain usable without leaking secrets.

## Deploy With DeepSeek

Recommended production path: deploy this repository to Vercel. Vercel serves the Vite frontend and the serverless API routes in `api/`.

Required Vercel environment variables:

```bash
DEEPSEEK_API_KEY="your-server-side-key"
DEEPSEEK_MODEL="deepseek-chat"
DEEPSEEK_API_URL="https://api.deepseek.com/chat/completions"
APP_ORIGIN="https://your-vercel-domain.vercel.app"
```

If GitHub Pages should call the Vercel API, set `APP_ORIGIN` to include both origins:

```bash
APP_ORIGIN="https://github-backtrans.vercel.app,https://aloofbear.github.io"
```

## Mainland China Deployment

For users in mainland China, do not rely on the browser calling `*.vercel.app` directly. Deploy the same repository to a mainland-accessible Node or Docker host, such as a Tencent Cloud Lighthouse server, Alibaba Cloud ECS, or another server with a domain reachable from mainland networks.

Single-service deployment:

```bash
npm ci
npm run build
DEEPSEEK_API_KEY="your-server-side-key" npm run start
```

The production Node server serves both the Vite app and `/api/analyze-translation` from the same origin, so the browser no longer needs to call Vercel.

The same server also stores product analytics events:

```text
POST /api/events
GET  /api/analytics/summary?days=30
```

The `/analytics` page shows the training funnel, AI success rate, feedback expansion rate, favorite rate, review usage, daily trend, and top corpus submissions. HTTPS frontends can send analytics through the Vercel proxy, which forwards events to the mainland ECS endpoint.

Set `ANALYTICS_ADMIN_TOKEN` on the server to protect the analytics dashboard and summary API. Without this token, `GET /api/analytics/summary` returns `401`, and the `/analytics` page only shows an admin access prompt.

The ECS Node server also provides the low-cost account system:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
GET  /api/user-data
PUT  /api/user-data
```

Usernames are unique in SQLite, passwords are hashed with `scrypt`, session tokens are stored as hashes, and every login creates an independent session so the same account can stay signed in on multiple devices. Set `ADMIN_USERNAME` and `ADMIN_INITIAL_PASSWORD` on first deployment to bootstrap the admin account; later deployments keep the existing password and only ensure the role is admin.

Docker deployment:

```bash
docker build -t backtrans .
docker run -p 8787:8787 \
  -e DEEPSEEK_API_KEY="your-server-side-key" \
  -e DEEPSEEK_MODEL="deepseek-chat" \
  -e DEEPSEEK_API_URL="https://api.deepseek.com/chat/completions" \
  backtrans
```

If the static frontend stays on GitHub Pages, build it with a mainland API first and Vercel as backup:

```bash
VITE_API_BASE_URLS="https://api.your-domain.cn,https://github-backtrans.vercel.app" npm run build
```

After deployment, the frontend calls:

```text
/api/analyze-translation
```

The browser never receives `DEEPSEEK_API_KEY`.

## Scripts

```bash
npm run dev        # frontend dev server
npm run dev:api    # Express AI proxy
npm run build      # type-check and build
npm run lint       # TypeScript check
npm run qa:corpus  # corpus sanity checks
```

## Roadmap

- Add password reset and optional phone/email verification when the project needs real public-user operations.
- Add export/import for cloud and local learning records.
- Add spaced repetition scheduling by expression-level mastery.
- Add source attribution and review workflow for corpus content.
- Add cohort retention and experiment comparison on top of the first-party analytics event log.
