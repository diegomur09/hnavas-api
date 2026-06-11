// Environment-dependent configuration, in one place. Every value can be
// overridden per environment (Lambda env vars in qa/prod, .env locally) and
// has a safe development default so the server runs with no .env at all.

const {
  NODE_ENV,
  JWT_SECRET,
  AWS_REGION,
  USERS_TABLE,
  LEADS_TABLE,
  MEMORY_TABLE,
  ADMIN_EMAIL,
  ALLOWED_ORIGINS,
  PORT,
} = process.env;

// In production the secret MUST come from the environment (never from git).
// In development the code runs and signs tokens with a throwaway dev key.
export const jwtSecret = NODE_ENV === 'production' && JWT_SECRET ? JWT_SECRET : 'dev-secret-not-for-production';

export const region = AWS_REGION ?? 'us-east-1';
export const usersTable = USERS_TABLE ?? 'hnavas-users';
export const leadsTable = LEADS_TABLE ?? 'hnavas-leads';
export const memoryTable = MEMORY_TABLE ?? 'hnavas-agent-memory';

// The site owner's account. Signing up with this email grants the admin role,
// and leads captured by the AI agent / public contact form are stored under
// this account. Until that account exists, those leads are emailed only.
export const adminEmail = ADMIN_EMAIL ?? 'hnavasystems@gmail.com';

export const port = PORT ?? 3000;

export const TOKEN_TTL = '7d'; // how long a login session lasts
export const BCRYPT_ROUNDS = 10; // standard cost factor for password hashing

// CORS. The site's own origins are ALWAYS allowed (defaulted in code) so the
// custom domain works regardless of the ALLOWED_ORIGINS env var. Extra origins
// can be added via ALLOWED_ORIGINS (comma-separated); "*" or no value allows
// everything (local/dev convenience).
const SITE_ORIGINS = [
  'https://hnavasystems.com',
  'https://www.hnavasystems.com',
  'https://d6o054dnj9ven.cloudfront.net', // prod CloudFront
  'https://dpfbof69kqlws.cloudfront.net', // qa CloudFront
];
const envOrigins = (ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const allowAll = !ALLOWED_ORIGINS || envOrigins.includes('*');
const allowList = [...new Set([...SITE_ORIGINS, ...envOrigins.filter((o) => o !== '*')])];

// `true` = reflect any origin; otherwise the merged allowlist.
export const corsOrigin = allowAll ? true : allowList;
