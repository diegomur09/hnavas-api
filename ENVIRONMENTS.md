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
| `ALLOWED_ORIGINS` | `https://qa.hnavasystems.com`   | `https://hnavasystems.com`   |
| `AGENT_MODEL`     | `gpt-4o-mini` (optional)         | `gpt-4o-mini` (optional)      |

> Generate **two** OpenAI keys (one per environment) so usage/limits are
> isolated. Put the QA key on the QA Lambda, the prod key on the prod Lambda.
> The local `.env` (git-ignored) is only for development.
