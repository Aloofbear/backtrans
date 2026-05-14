# BackTrans

BackTrans is an English back-translation practice app for Chinese-native learners who want to improve natural written expression. It combines long-form back-translation, short sentence drills, structured feedback, local learning records, and a review queue.

Live demo: https://github-backtrans.vercel.app/

GitHub Pages mirror: https://aloofbear.github.io/backtrans/

## Product Focus

- Practice Chinese-to-English output against polished native English references.
- Receive structured feedback on accuracy, grammar, vocabulary, and naturalness.
- Save important expressions into a review queue instead of a simple bookmark list.
- Use local learning profiles for MVP-stage practice without pretending to provide cloud accounts.

## Current Architecture

- Frontend: React, Vite, Tailwind CSS, React Router.
- AI proxy: Vercel serverless API routes in `api/` for production, plus `server/index.ts` as a local development proxy.
- Persistence: browser `localStorage` scoped by local learning profile.
- Static hosting: GitHub Pages can serve the app, but AI feedback requires a deployed API proxy.

## Local Development

Prerequisites: Node.js 20+ and npm.

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

- Replace local profiles with real authentication and cloud sync.
- Add export/import for local learning records.
- Add spaced repetition scheduling by expression-level mastery.
- Add source attribution and review workflow for corpus content.
- Track product events such as practice started, feedback generated, and review completed.
