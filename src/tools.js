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

import { sendEmail, renderEmail, NOTIFY_EMAIL, isEmail } from "./email.js";

const CONTACT_EMAIL = "hnavasystems@gmail.com";

// Public Cal.com booking link (not a secret) — defaulted in code so no Lambda
// env var is needed. Override with CALENDAR_URL if it ever changes.
const CALENDAR_URL = process.env.CALENDAR_URL?.trim() || "https://cal.com/diego-navas-murcia-6a7b9n";

// Tiny localized strings for the client-facing emails (mirror the chat locale).
const t = (locale, en, es) => (locale === "es" ? es : en);

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
        "Share HOW to book a call (the scheduling link or email) when the visitor is just asking how to reach Diego but isn't ready to give details yet. If they ARE ready to book, prefer agendar_reunion.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "agendar_reunion",
      description:
        "Request and confirm a meeting with Diego when the visitor is ready to book one. Collect their name, email, a preferred date/time in their own words (e.g. 'Tuesday afternoon', 'next week'), and the topic. It emails a confirmation to the visitor and notifies Diego, who locks in the final time.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "The visitor's name." },
          email: { type: "string", description: "The visitor's email address." },
          preferred_time: {
            type: "string",
            description: "Their preferred date/time, in their own words.",
          },
          topic: { type: "string", description: "What the meeting is about." },
        },
        required: ["name", "email", "preferred_time"],
        additionalProperties: false,
      },
    },
  },
];

// ─── Lead emailing (shared by the crear_lead tool AND the /contact form) ─────
// Sends the branded notification to Diego (Reply-To = client) plus a localized
// acknowledgement to the client. Inputs are assumed already validated.
export async function emailLead({ name, email, project, locale }) {
  console.log("CONTACT LEAD:", JSON.stringify({ name, email, project }));

  // Notify Diego — replying to this email replies straight to the client.
  const notifyBody = renderEmail({
    heading: `New lead: ${name}`,
    preheader: `${name} wants: ${project}`,
    paragraphs: [`Project: ${project}`, "Reply to this email to reach the client directly."],
    details: [
      { label: "Name", value: name },
      { label: "Email", value: email },
    ],
  });
  const notify = await sendEmail({
    to: NOTIFY_EMAIL,
    replyTo: email,
    subject: `New lead from the website: ${name}`,
    html: notifyBody.html,
    text: notifyBody.text,
  });

  // Acknowledge the client (in their language), branded like the site.
  const ackBody = renderEmail({
    heading: t(locale, `Thanks, ${name}!`, `¡Gracias, ${name}!`),
    preheader: t(locale, "Diego received your project details.", "Diego recibió los detalles de tu proyecto."),
    paragraphs: [
      t(
        locale,
        "Thanks for reaching out to HNavas Systems. Diego received your project details and will get back to you, usually within a day.",
        "Gracias por contactar a HNavas Systems. Diego recibió los detalles de tu proyecto y te responderá, normalmente en un día.",
      ),
      `“${project}”`,
      t(locale, "You can reply to this email anytime.", "Puedes responder a este correo cuando quieras."),
    ],
  });
  await sendEmail({
    to: email,
    subject: t(locale, "Thanks — Diego will be in touch", "Gracias — Diego te contactará"),
    html: ackBody.html,
    text: ackBody.text,
  });

  return { emailed: notify.ok };
}

// ─── Executor: crear_lead ────────────────────────────────────────────────────
// Validates, then emails the lead (same path the contact form uses).
async function execCrearLead(args, { locale } = {}) {
  const name = String(args?.name ?? "").trim().slice(0, 120);
  const email = String(args?.email ?? "").trim().slice(0, 200);
  const project = String(args?.project ?? "").trim().slice(0, 2000);

  if (!name || !email || !project) {
    return { ok: false, error: "missing-fields", need: ["name", "email", "project"] };
  }
  if (!isEmail(email)) {
    return { ok: false, error: "invalid-email" };
  }

  const { emailed } = await emailLead({ name, email, project, locale });
  return {
    ok: true,
    emailed,
    message: "Lead saved and emailed to Diego; the client received a confirmation.",
  };
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
  return { ok: true, method: "link", schedulingUrl: CALENDAR_URL, email: CONTACT_EMAIL };
}

// ─── Executor: agendar_reunion ───────────────────────────────────────────────
// Records a meeting request and emails both sides. If CALENDAR_URL (e.g. a
// Cal.com link) is set, the client email also offers instant self-booking.
async function execAgendarReunion(args, { locale } = {}) {
  const name = String(args?.name ?? "").trim().slice(0, 120);
  const email = String(args?.email ?? "").trim().slice(0, 200);
  const preferred = String(args?.preferred_time ?? "").trim().slice(0, 300);
  const topic = String(args?.topic ?? "").trim().slice(0, 500) || t(locale, "an intro call", "una llamada inicial");

  if (!name || !email || !preferred) {
    return { ok: false, error: "missing-fields", need: ["name", "email", "preferred_time"] };
  }
  if (!isEmail(email)) return { ok: false, error: "invalid-email" };

  console.log("MEETING REQUEST (via agent tool):", JSON.stringify({ name, email, preferred, topic }));

  const calUrl = CALENDAR_URL;

  // Notify Diego (replying reaches the client directly).
  const notifyBody = renderEmail({
    heading: `Meeting request: ${name}`,
    preheader: `${preferred} — ${topic}`,
    paragraphs: ["Reply to this email to confirm with the client."],
    details: [
      { label: "Name", value: name },
      { label: "Email", value: email },
      { label: "Preferred time", value: preferred },
      { label: "Topic", value: topic },
    ],
  });
  const notify = await sendEmail({
    to: NOTIFY_EMAIL,
    replyTo: email,
    subject: `Meeting request: ${name}`,
    html: notifyBody.html,
    text: notifyBody.text,
  });

  // Confirm to the client (their language), branded, with a booking button.
  const confirmBody = renderEmail({
    heading: t(locale, "Your meeting request", "Tu solicitud de reunión"),
    preheader: t(locale, "Diego will confirm the time shortly.", "Diego confirmará el horario en breve."),
    paragraphs: [
      t(
        locale,
        `Hi ${name}, thanks! We received your request to meet. Diego will confirm the final time by email shortly.`,
        `Hola ${name}, ¡gracias! Recibimos tu solicitud de reunión. Diego te confirmará el horario final por correo en breve.`,
      ),
      calUrl
        ? t(locale, "Prefer to pick an exact slot now? Use the button below.", "¿Prefieres elegir un horario exacto ya? Usa el botón de abajo.")
        : "",
    ].filter(Boolean),
    details: [
      { label: t(locale, "Topic", "Tema"), value: topic },
      { label: t(locale, "Preferred time", "Horario preferido"), value: preferred },
    ],
    button: calUrl ? { label: t(locale, "Book a time", "Reservar horario"), url: calUrl } : undefined,
  });
  await sendEmail({
    to: email,
    subject: t(locale, "Your meeting request — HNavas Systems", "Tu solicitud de reunión — HNavas Systems"),
    html: confirmBody.html,
    text: confirmBody.text,
  });

  return {
    ok: true,
    emailed: notify.ok,
    bookingUrl: calUrl || undefined,
    message: "Meeting request emailed to the client and Diego; Diego will confirm the final time.",
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
        return await execCrearLead(args, ctx);
      case "consultar_github":
        return await execConsultarGithub(args);
      case "agendar_llamada":
        return execAgendarLlamada();
      case "agendar_reunion":
        return await execAgendarReunion(args, ctx);
      default:
        return { ok: false, error: "unknown-tool", name };
    }
  } catch (err) {
    return { ok: false, error: "tool-failed", detail: String(err?.message ?? err) };
  }
}
