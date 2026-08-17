import { findUserByEmail } from '../db/users.js';
import { createLead } from '../db/leads.js';
import { adminEmail } from '../config.js';

// The site owner's user id, looked up once and cached for the lifetime of the
// process (Lambda container). Not cached when missing, so the first lead after
// the admin account is created starts being stored.
let cachedAdminId = null;

async function getAdminId() {
  if (cachedAdminId) return cachedAdminId;
  const admin = await findUserByEmail(adminEmail);
  if (admin) cachedAdminId = admin._id;
  return cachedAdminId;
}

// Store a lead captured by the public site (AI agent tool or contact form)
// under the site owner's account, so it shows up in the admin lead inbox.
// Best-effort by design: any failure (missing table, missing admin account,
// IAM) is logged and swallowed — the email notification remains the source
// of truth and the visitor's request never fails because of this.
export default async function captureSiteLead({
  name, email, project, locale, source,
}) {
  try {
    const owner = await getAdminId();
    if (!owner) return;
    await createLead({
      owner, name, email, project, locale, source,
    });
  } catch (err) {
    console.error('captureSiteLead failed:', err?.message ?? err);
  }
}
