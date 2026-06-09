import express from "express";
import cors from "cors";
import { generateReply, isConfigured } from "./agent.js";
import { emailLead } from "./tools.js";
import { isEmail } from "./email.js";

export const app = express();

app.use(express.json({ limit: "64kb" }));

// CORS: lock to the site origin(s) in prod via ALLOWED_ORIGINS (comma-separated).
// Defaults to "*" so reviewers can run it without config.
const allowed = (process.env.ALLOWED_ORIGINS ?? "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: allowed.includes("*") ? true : allowed,
    methods: ["POST", "GET", "OPTIONS"],
  }),
);

// --- Tiny in-memory rate limiter (per IP). Good enough to stop demo abuse and
// protect the token budget; resets when the Lambda container recycles. ---
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_HITS = 20; // requests per window per IP
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.reset) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_HITS;
}

function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length) return fwd.split(",")[0].trim();
  return req.ip || "unknown";
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, agent: isConfigured() ? "ready" : "not-configured" });
});

app.post("/chat", async (req, res) => {
  if (rateLimited(clientIp(req))) {
    return res.status(429).json({ error: "rate-limited" });
  }
  if (!isConfigured()) {
    // Frontend falls back to its built-in demo replies on a non-200.
    return res.status(503).json({ error: "agent-not-configured" });
  }

  try {
    const { messages, locale, visitorId } = req.body ?? {};
    const reply = await generateReply({ messages, locale, visitorId });
    res.json({ reply });
  } catch (err) {
    console.error("chat error:", err?.message ?? err);
    res.status(500).json({ error: "agent-failed" });
  }
});

app.post("/contact", async (req, res) => {
  if (rateLimited(clientIp(req))) {
    return res.status(429).json({ error: "rate-limited" });
  }
  const { name, email, project, locale } = req.body ?? {};
  if (!name || !email || !project) {
    return res.status(400).json({ error: "missing-fields" });
  }
  if (!isEmail(email)) {
    return res.status(400).json({ error: "invalid-email" });
  }

  // Same path as the agent's crear_lead tool: email Diego + acknowledge the
  // client (branded). emailLead is defensive, so the form never errors on email.
  try {
    await emailLead({
      name: String(name).slice(0, 120),
      email: String(email).slice(0, 200),
      project: String(project).slice(0, 2000),
      locale,
    });
  } catch (err) {
    console.error("contact emailLead failed:", err?.message ?? err);
  }
  res.json({ ok: true });
});

export default app;
