import express from 'express';
import cors from 'cors';
import { generateReply, isConfigured } from './agent.js';
import { emailLead } from './tools.js';
import { isEmail } from './email.js';

const app = express();

app.use(express.json({ limit: '64kb' }));

// CORS. The site's own origins are ALWAYS allowed (defaulted in code) so the
// custom domain works regardless of the ALLOWED_ORIGINS env var — which only
// listed a CloudFront URL and broke requests from hnavasystems.com. Extra
// origins can still be added via ALLOWED_ORIGINS (comma-separated); "*" or no
// value allows everything (local/dev convenience).
const SITE_ORIGINS = [
  'https://hnavasystems.com',
  'https://www.hnavasystems.com',
  'https://d6o054dnj9ven.cloudfront.net', // prod CloudFront
  'https://dpfbof69kqlws.cloudfront.net', // qa CloudFront
];
const envRaw = process.env.ALLOWED_ORIGINS;
const envOrigins = (envRaw ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const allowAll = !envRaw || envOrigins.includes('*');
const allowed = [...new Set([...SITE_ORIGINS, ...envOrigins.filter((o) => o !== '*')])];
app.use(
  cors({
    origin: allowAll ? true : allowed,
    methods: ['POST', 'GET', 'OPTIONS'],
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
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
  return req.ip || 'unknown';
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, agent: isConfigured() ? 'ready' : 'not-configured' });
});

app.post('/chat', async (req, res) => {
  if (rateLimited(clientIp(req))) {
    res.status(429).json({ error: 'rate-limited' });
    return;
  }
  if (!isConfigured()) {
    // Frontend falls back to its built-in demo replies on a non-200.
    res.status(503).json({ error: 'agent-not-configured' });
    return;
  }

  try {
    const { messages, locale, visitorId } = req.body ?? {};
    const reply = await generateReply({ messages, locale, visitorId });
    res.json({ reply });
  } catch (err) {
    console.error('chat error:', err?.message ?? err);
    res.status(500).json({ error: 'agent-failed' });
  }
});

app.post('/contact', async (req, res) => {
  if (rateLimited(clientIp(req))) {
    res.status(429).json({ error: 'rate-limited' });
    return;
  }
  const {
    name, email, project, locale,
  } = req.body ?? {};
  if (!name || !email || !project) {
    res.status(400).json({ error: 'missing-fields' });
    return;
  }
  if (!isEmail(email)) {
    res.status(400).json({ error: 'invalid-email' });
    return;
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
    console.error('contact emailLead failed:', err?.message ?? err);
  }
  res.json({ ok: true });
});

export default app;
