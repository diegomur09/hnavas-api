import { MESSAGES } from '../constants.js';

// Tiny in-memory rate limiter (per IP). Good enough to stop demo abuse and
// protect the token budget; resets when the Lambda container recycles.
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_HITS = 20; // requests per window per IP
const hits = new Map();

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
  return req.ip || 'unknown';
}

export default function rateLimit(req, res, next) {
  const ip = clientIp(req);
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now > entry.reset) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    next();
    return;
  }

  entry.count += 1;
  if (entry.count > MAX_HITS) {
    res.status(429).json({ error: MESSAGES.RATE_LIMITED });
    return;
  }
  next();
}
