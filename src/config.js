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
  // Set automatically by the Lambda runtime on every function; absent locally.
  AWS_LAMBDA_FUNCTION_NAME,
} = process.env;

// "Are we running for real?" — true in any Lambda, or when NODE_ENV says so.
// This deliberately does NOT rely on NODE_ENV alone: the prod Lambda never had
// it set, which is exactly how it silently fell back to the throwaway dev key
// (a public value in this repo) to sign real JWTs. Presence in Lambda is the
// signal that cannot be forgotten.
const isRuntime = Boolean(AWS_LAMBDA_FUNCTION_NAME) || NODE_ENV === 'production';

// The JWT signing secret. In any real runtime it MUST come from the environment
// and be non-trivial; there is no safe default. We fail closed at startup
// rather than serve requests with a guessable/public secret. Local development
// (no Lambda, no NODE_ENV=production) keeps a throwaway key so the server runs
// with no .env at all.
const DEV_JWT_SECRET = 'dev-secret-not-for-production';

function resolveJwtSecret() {
  if (!isRuntime) return DEV_JWT_SECRET;
  if (!JWT_SECRET || JWT_SECRET.trim().length < 32 || JWT_SECRET === DEV_JWT_SECRET) {
    throw new Error(
      'JWT_SECRET is missing, too short (<32 chars), or the public dev value. '
      + 'Set a strong JWT_SECRET on this environment before it can serve auth. '
      + 'Refusing to start with an insecure signing key.',
    );
  }
  return JWT_SECRET;
}

export const jwtSecret = resolveJwtSecret();

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
