# HNavas Systems — Agent & Contact Backend

Small **backend-driven** service for the website's AI chat agent and contact form.
Runs locally with Express and deploys to **AWS Lambda** (Function URL) via `serverless-http`.

## Why a backend (key safety)

The OpenAI API key is a **secret**. It lives **only here, on the server** — in
`backend/.env` locally, and in the Lambda's environment variables in production.

- The browser/frontend **never** sees the key. It only knows this service's URL
  (`NEXT_PUBLIC_AGENT_URL`), which is just an address, not a secret.
- `.env` is git-ignored, so keys are never committed.
- Every model call goes **through this backend** — the frontend talks to `/chat`,
  this service adds the key and calls OpenAI. That's the whole point of the split.

```
Browser ──fetch──▶  /chat (this backend, holds the key)  ──▶  OpenAI
   ▲                                                            │
   └────────────────────  reply (no key ever exposed)  ◀───────┘
```

## Endpoints

| Method | Path       | Body                              | Notes |
|--------|------------|-----------------------------------|-------|
| GET    | `/health`  | —                                 | `{ ok, agent: "ready" \| "not-configured" }` |
| POST   | `/chat`    | `{ messages: [{role,content}], locale }` | Returns `{ reply }`. Rate-limited. |
| POST   | `/contact` | `{ name, email, project }`        | Logs the lead (SES wiring is the next step). |

Model: **`gpt-4o-mini`** (cheapest reliable option). Override with `AGENT_MODEL`.
Built-in guards: per-IP rate limit (20 req / 10 min), history capped to 12 turns,
replies capped at 400 tokens — so the token budget stays bounded.

## Run locally

```bash
cd backend
npm install
cp .env.example .env        # then put your OPENAI_API_KEY in .env
node --env-file=.env src/local.js   # or: npm run dev  (after exporting env vars)
# → http://localhost:3001/health
```

Then point the frontend at it: in `frontend/.env.local` set
`NEXT_PUBLIC_AGENT_URL=http://localhost:3001`.

**No key?** That's fine for reviewers: leave `OPENAI_API_KEY` unset (or skip the
backend entirely) and the site's chat falls back to its built-in demo replies.

## Deploy to AWS Lambda (cheapest path)

The frontend stays static on S3 + CloudFront; this backend is one Lambda.

1. Package: `npm ci --omit=dev` then zip the folder (`src/`, `node_modules/`,
   `package.json`).
2. Create a Node.js 20 Lambda; handler = `src/lambda.handler`.
3. Add a **Function URL** (Auth type: NONE) — no API Gateway needed, and it's free.
4. Set the Lambda's **environment variables** (this is where the key lives in prod):
   - `OPENAI_API_KEY` = your key
   - `ALLOWED_ORIGINS` = `https://hnavasystems.com,https://www.hnavasystems.com`
5. Put the Function URL into the frontend's `NEXT_PUBLIC_AGENT_URL` and redeploy.

Reviewers then just open the live site — the agent works, and the key stays
safely in the Lambda's environment, never in anything they can see.

## Next steps
- Wire Amazon SES into `/contact` so leads arrive by email (currently logged).
- Optionally move rate-limit state to DynamoDB if you run many concurrent Lambdas.
