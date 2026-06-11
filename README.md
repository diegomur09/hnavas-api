# HNavas Systems — Agent & Contact API (`hnavas-api`)

Backend for the [HNavas Systems](https://github.com/diegomur09/hnavas-web) website:
an **AI chat agent** and a **contact** endpoint. It's **backend-driven** — the
OpenAI API key lives only on the server, never in the browser or the repo. Runs
locally with Express and on **AWS Lambda** (Function URL) via `serverless-http`.

## Links

| | Web (Frontend) | API (Backend) |
|---|---|---|
| **Producción** | https://hnavasystems.com | https://vvbwtcwlds3irp4ubw2b4cumaq0oumrl.lambda-url.us-east-1.on.aws/health |
| **QA** | https://dpfbof69kqlws.cloudfront.net/en | https://tfpo7fqoszogi2qtznsxuhblb40kmyzt.lambda-url.us-east-1.on.aws/health |

> Production is live on the custom domain `hnavasystems.com` (apex + www → CloudFront,
> HTTPS via ACM). The API links open `/health` (a status check) — the API is a service,
> not a web page.

## Endpoints

| Method | Path       | Body                                       | Returns |
|--------|------------|--------------------------------------------|---------|
| GET    | `/health`  | —                                          | `{ ok, agent }` |
| POST   | `/chat`    | `{ messages: [{role,content}], locale }`   | `{ reply }` |
| POST   | `/contact` | `{ name, email, project }`                 | `{ ok: true }` |

Model: **`gpt-4o-mini`** (cheapest reliable option; override with `AGENT_MODEL`).
Guards: per-IP rate limit (20 req / 10 min), history capped to 12 turns, replies
capped at 400 tokens — so the token budget stays bounded.

## Knowledge / RAG

The agent answers from Diego's **real content** using retrieval-augmented
generation (RAG), instead of relying on a hand-written summary in the prompt.

```
source.js  ──(build.mjs, run once)──▶  knowledge.json  ──(retrieve.js)──▶  top-k chunks
  notes            embed each chunk          text + vectors      cosine search per question
```

- **`src/knowledge/source.js`** — the human-authored notes (one chunk per
  project / service / topic, EN + ES), pulled verbatim from the site content.
- **`npm run build:knowledge`** — embeds every chunk with
  `text-embedding-3-small` (1536-dim) and writes `src/knowledge/knowledge.json`.
  Re-run whenever `source.js` changes. Cost: a fraction of a cent per rebuild.
- **`src/retrieve.js`** — on each `/chat`, embeds the question and returns the
  most similar chunks (cosine similarity); `agent.js` injects them as grounding.

**Graceful by design:** if `knowledge.json` is missing or `OPENAI_API_KEY` is
unset, retrieval returns nothing and the agent falls back to its base summary —
the chat never fails because of RAG. The index is a plain in-memory JSON (no
vector database needed at this scale).

> First-time setup: `npm run build:knowledge` (needs `OPENAI_API_KEY` in `.env`).
> The model used here must match `EMBED_MODEL` in `retrieve.js`.

## Tools / actions (function calling)

Beyond answering, the agent can take real actions via OpenAI function calling.
The model only **proposes** a call as structured JSON; the backend
(`src/tools.js`) **validates the arguments and executes** with server-side
credentials the model never sees. `agent.js` runs a capped tool-calling loop
(`MAX_TOOL_ROUNDS`): the model asks for a tool (trip 1), we run it and feed the
result back, the model phrases the reply (trip 2).

| Tool | Does | Setup |
|------|------|-------|
| `crear_lead` | Records a lead (name, email, project) and **emails it** — notifies Diego (Reply-To = the client) and sends the client a confirmation. | SES (verified `hnavasystems.com`) |
| `agendar_reunion` | Books a meeting request (name, email, preferred time, topic); emails a confirmation to the client (with the Cal.com link) and notifies Diego. | SES + `CALENDAR_URL` |
| `agendar_llamada` | Shares the Cal.com booking link / how to reach Diego. | `CALENDAR_URL` (defaulted in code) |
| `consultar_github` | Returns Diego's live public GitHub profile + recent repos (cached 10 min). | None — works tokenless; set `GITHUB_TOKEN` for a higher rate limit |

Emails go through **Amazon SES** (`src/email.js`) from `noreply@hnavasystems.com`
(DKIM-signed); the Lambda role needs `ses:SendEmail`. Config defaults live in code
(no Lambda env var needed). Every executor is defensive and returns
`{ ok: false, error }` instead of throwing, so a failing tool (or email) degrades
into a graceful in-chat message.

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
cp .env.example .env   # put your OPENAI_API_KEY in .env (git-ignored)
npm run dev            # hot reload — http://localhost:3000/health
```

`npm run start` runs the same server without hot reload. Both load `.env` if it
exists and run fine without one — no key? The site's chat falls back to demo
replies. `npm run lint` checks the code style (ESLint, airbnb-base).

## Deployment

CI/CD deploys **code** on every push (`qa` → QA Lambda, `main` → production Lambda).
The secrets (`OPENAI_API_KEY`, `ALLOWED_ORIGINS`) are set once on each Lambda's
environment — never in this repo, never in CI.

## Next steps

- Wire Amazon SES into `/contact` so leads arrive by email (currently logged).
- Tighten `ALLOWED_ORIGINS` from `*` to the live CloudFront domains.
