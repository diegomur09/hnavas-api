# Environments — hnavas-api

Branch-based, two isolated environments.

| Branch | Environment | Lambda                | Allowed origin (CORS)         |
|--------|-------------|-----------------------|-------------------------------|
| `qa`   | QA / testing | `hnavas-agent-api-qa` | `https://qa.hnavasystems.com` |
| `main` | Production   | `hnavas-agent-api`    | `https://hnavasystems.com`    |

**Flow:** push to `qa` → deploys QA Lambda → test against the QA frontend.
When it works, merge `qa` → `main` → deploys production.

## Environment variables (set on each Lambda, never in the repo)

Each environment has its **own** values. Secrets live only in the Lambda's
environment configuration (or `backend/.env` for local dev).

| Variable          | QA Lambda                       | Prod Lambda                  |
|-------------------|---------------------------------|------------------------------|
| `OPENAI_API_KEY`  | **separate QA key**             | **separate prod key**        |
| `JWT_SECRET`      | **required, ≥32 random chars**  | **required, ≥32 random chars** |
| `ALLOWED_ORIGINS` | `https://qa.hnavasystems.com`   | `https://hnavasystems.com`   |
| `AGENT_MODEL`     | `gpt-4o-mini` (optional)         | `gpt-4o-mini` (optional)      |

> Generate **two** OpenAI keys (one per environment) so usage/limits are
> isolated. Put the QA key on the QA Lambda, the prod key on the prod Lambda.
> The local `.env` (git-ignored) is only for development.

> **`JWT_SECRET` is required in every real deployment.** When the code runs in
> Lambda it refuses to start without a strong `JWT_SECRET` (≥32 chars, not the
> dev default), so login tokens can never be signed with a guessable key. Use a
> **different** secret per environment, e.g. `openssl rand -hex 32`. Do NOT
> deploy to a Lambda that has no `JWT_SECRET` set — the function will fail to
> start and every endpoint, chat included, will 500. Set the variable first,
> then deploy.
