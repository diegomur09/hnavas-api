// ─────────────────────────────────────────────────────────────────────────────
// TOOLS — the agent's "hands" (function calling / Capa de Acción).
//
// SECURITY MODEL (matches the project's research notes):
//   The LLM only PROPOSES a tool call as structured JSON. It never executes
//   anything and never sees any secret. This file is the control layer: it
//   VALIDATES every argument, runs the real action with server-side
//   credentials, and returns a result the model can read.
//
// Two exports:
//   • TOOL_SCHEMAS  — the descriptions the model sees (names, params). NO code.
//   • executeTool() — the real executors, run by OUR backend only.
//
// Every executor is defensive: it never throws. On any problem it returns
// `{ ok: false, error }` so the agent can recover gracefully in conversation.
// ─────────────────────────────────────────────────────────────────────────────

const CONTACT_EMAIL = "diegomurcia2@gmail.com";

// ── Schemas shown to the model ───────────────────────────────────────────────
// Keep descriptions action-oriented so the model knows WHEN to call each one.
export const TOOL_SCHEMAS = [
  {
    type: "function",
    function: {
      name: "crear_lead",
      description:
        "Capture a sales lead when a visitor shares their contact details and what they want to build. Call this as soon as you have a name, an email, and a short project description — it records the lead so Diego can follow up.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "The visitor's name." },
          email: { type: "string", description: "The visitor's email address." },
          project: {
            type: "string",
            description: "A short description of what the visitor wants to build.",
          },
        },
        required: ["name", "email", "project"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "consultar_github",
      description:
        "Look up Diego's live, public GitHub activity (profile stats and recent repositories). Call this when a visitor asks about Diego's GitHub, his open-source work, how active he is, or what he has been building lately.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            description: "How many recent repositories to return (1-10). Default 5.",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "agendar_llamada",
      description:
        "Provide the way to book a call or appointment with Diego. Call this when a visitor wants to schedule a meeting, book a call, or talk to Diego directly.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
];

// ─── Executor: crear_lead ────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function execCrearLead(args) {
  const name = String(args?.name ?? "").trim().slice(0, 120);
  const email = String(args?.email ?? "").trim().slice(0, 200);
  const project = String(args?.project ?? "").trim().slice(0, 2000);

  if (!name || !email || !project) {
    return { ok: false, error: "missing-fields", need: ["name", "email", "project"] };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "invalid-email" };
  }

  // Lead capture. Same sink as POST /contact (logged for now; SES is the
  // documented next step). The frontend also keeps a mailto fallback.
  console.log("CONTACT LEAD (via agent tool):", JSON.stringify({ name, email, project }));
  return { ok: true, message: "Lead saved. Diego will follow up, usually within a day." };
}

// ─── Executor: consultar_github ──────────────────────────────────────────────
// Username is fixed server-side (never taken from the model) — minimal scope.
// Works tokenless (public API, 60 req/h). If GITHUB_TOKEN is set it's used for
// a higher limit (5000 req/h). Results cached in memory to protect the budget.
const GITHUB_USER = process.env.GITHUB_USER ?? "diegomur09";
const GH_CACHE_MS = 10 * 60 * 1000; // 10 minutes
let ghCache = { at: 0, data: null };

function ghHeaders() {
  const h = { Accept: "application/vnd.github+json", "User-Agent": "hnavas-agent" };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

async function fetchGithub() {
  const now = Date.now();
  if (ghCache.data && now - ghCache.at < GH_CACHE_MS) return ghCache.data;

  const [profileRes, reposRes] = await Promise.all([
    fetch(`https://api.github.com/users/${GITHUB_USER}`, { headers: ghHeaders() }),
    fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=100`, {
      headers: ghHeaders(),
    }),
  ]);
  if (!profileRes.ok || !reposRes.ok) {
    throw new Error(`github-${profileRes.status}/${reposRes.status}`);
  }

  const profile = await profileRes.json();
  const repos = await reposRes.json();

  const data = {
    username: profile.login,
    name: profile.name,
    bio: profile.bio,
    url: profile.html_url,
    publicRepos: profile.public_repos,
    followers: profile.followers,
    repos: (Array.isArray(repos) ? repos : [])
      .filter((r) => !r.fork)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .map((r) => ({
        name: r.name,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count,
        updated: r.updated_at?.slice(0, 10),
        url: r.html_url,
      })),
  };

  ghCache = { at: now, data };
  return data;
}

async function execConsultarGithub(args) {
  const limit = Math.min(Math.max(Number(args?.limit) || 5, 1), 10);
  try {
    const data = await fetchGithub();
    return {
      ok: true,
      profile: {
        username: data.username,
        name: data.name,
        bio: data.bio,
        url: data.url,
        publicRepos: data.publicRepos,
        followers: data.followers,
      },
      recentRepos: data.repos.slice(0, limit),
    };
  } catch (err) {
    return { ok: false, error: "github-unavailable", detail: String(err?.message ?? err) };
  }
}

// ─── Executor: agendar_llamada ───────────────────────────────────────────────
// Returns a booking link from env (CALENDAR_URL, e.g. a Cal.com link) when set,
// otherwise falls back to email scheduling. Works today; drop in the link later.
function execAgendarLlamada() {
  const url = process.env.CALENDAR_URL?.trim();
  if (url) {
    return { ok: true, method: "link", schedulingUrl: url, email: CONTACT_EMAIL };
  }
  return {
    ok: true,
    method: "email",
    email: CONTACT_EMAIL,
    note: "No online scheduler is configured yet; ask the visitor to email Diego to set a time.",
  };
}

// ── Dispatcher ───────────────────────────────────────────────────────────────
/**
 * Run a tool the model asked for. Always resolves (never throws).
 * @param {string} name   Tool name from the model.
 * @param {object} args   Parsed arguments from the model.
 * @param {{locale?: string}} ctx
 * @returns {Promise<object>} JSON-serializable result handed back to the model.
 */
export async function executeTool(name, args, ctx = {}) {
  try {
    switch (name) {
      case "crear_lead":
        return execCrearLead(args);
      case "consultar_github":
        return await execConsultarGithub(args);
      case "agendar_llamada":
        return execAgendarLlamada();
      default:
        return { ok: false, error: "unknown-tool", name };
    }
  } catch (err) {
    return { ok: false, error: "tool-failed", detail: String(err?.message ?? err) };
  }
}
