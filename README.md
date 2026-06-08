# HNavas Systems — Agent & Contact API (`hnavas-api`)

Backend for the [HNavas Systems](https://github.com/diegomur09/hnavas-web) website:
an **AI chat agent** and a **contact** endpoint. It's **backend-driven** — the
OpenAI API key lives only on the server, never in the browser or the repo. Runs
locally with Express and on **AWS Lambda** (Function URL) via `serverless-http`.

## Links

| | |
|---|---|
| Backend / API repo | https://github.com/diegomur09/hnavas-api |
| Frontend repo | https://github.com/diegomur09/hnavas-web |
| API (QA) | `https://tfpo7fqoszogi2qtznsxuhblb40kmyzt.lambda-url.us-east-1.on.aws` |
| API (Production) | `https://vvbwtcwlds3irp4ubw2b4cumaq0oumrl.lambda-url.us-east-1.on.aws` |

## Endpoints

| Method | Path       | Body                                       | Returns |
|--------|------------|--------------------------------------------|---------|
| GET    | `/health`  | —                                          | `{ ok, agent }` |
| POST   | `/chat`    | `{ messages: [{role,content}], locale }`   | `{ reply }` |
| POST   | `/contact` | `{ name, email, project }`                 | `{ ok: true }` |

Model: **`gpt-4o-mini`** (cheapest reliable option; override with `AGENT_MODEL`).
Guards: per-IP rate limit (20 req / 10 min), history capped to 12 turns, replies
capped at 400 tokens — so the token budget stays bounded.

## System design

**Runtime architecture**

```
                       Visitor (browser)
                        │              │
            static page │              │ JSON: POST /chat, /contact
              requests   │              │
                         ▼              ▼
          ┌────────────────────┐   ┌──────────────────────────────┐
          │  CloudFront → S3   │   │  Lambda Function URL          │
          │  (hnavas-web,      │   │  hnavas-api (Node + Express)  │
          │  Next.js static)   │   │        │                      │
          └────────────────────┘   │        ▼                      │
                                    │  OpenAI API (gpt-4o-mini)     │
                                    └──────────────────────────────┘
```

**Key safety (why a backend at all)**

```
  Browser ──fetch──▶  /chat  ──▶  this API (holds the key)  ──▶  OpenAI
     ▲                                                            │
     └────────────────  reply (the key is never exposed)  ◀───────┘
```

The OpenAI key lives **only** in the Lambda's environment (or `.env` locally,
which is git-ignored). The browser only knows the API's URL — an address, not a
secret. The CI deploy role can update code but **cannot read or change** the
Lambda's environment, so the key never touches GitHub or CI.

**CI/CD (GitHub Actions + OIDC — no AWS keys stored in GitHub)**

```
  git push ──┬── qa ───▶ GitHub Actions ──OIDC──▶ aws lambda update-function-code
             │                                     → hnavas-agent-api-qa
             └── main ─▶ GitHub Actions ──OIDC──▶ aws lambda update-function-code
                                                   → hnavas-agent-api
```

## Tech stack

Node.js 22 (ESM) · Express · `serverless-http` · OpenAI SDK. Runs on **AWS Lambda**
with a public **Function URL**, deployed by **GitHub Actions** via OIDC.

## Environments

Branch-based: `main` = production, `qa` = testing — each with its **own** Lambda and
its **own** OpenAI key. See [ENVIRONMENTS.md](./ENVIRONMENTS.md).

## Local development

```bash
npm install
cp .env.example .env                 # put your OPENAI_API_KEY in .env (git-ignored)
node --env-file=.env src/local.js    # http://localhost:3001/health
```

No key? Leave `OPENAI_API_KEY` unset and the site's chat falls back to demo replies.

## Deployment

CI/CD deploys **code** on every push (`qa` → QA Lambda, `main` → production Lambda).
The secrets (`OPENAI_API_KEY`, `ALLOWED_ORIGINS`) are set once on each Lambda's
environment — never in this repo, never in CI.

## Next steps

- Wire Amazon SES into `/contact` so leads arrive by email (currently logged).
- Tighten `ALLOWED_ORIGINS` from `*` to the live CloudFront domains.
