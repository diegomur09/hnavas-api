// ─────────────────────────────────────────────────────────────────────────────
// EMAIL — transactional email via Amazon SES (Phase 3+: lead notifications,
// client acknowledgements, meeting confirmations).
//
// Sends from a verified hnavasystems.com address (DKIM-signed) for good
// deliverability. Replies go to Diego's inbox. Config defaults live IN CODE so
// no Lambda env var change is needed (keeps the OPENAI_API_KEY untouched).
//
// Defensive: never throws. On any failure it returns { ok: false } so the agent
// keeps the conversation going instead of erroring out.
// ─────────────────────────────────────────────────────────────────────────────

import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

const REGION = process.env.AWS_REGION ?? 'us-east-1';

// FROM must be on the SES-verified domain (hnavasystems.com). NOTIFY is where
// lead/meeting alerts land (Diego's inbox). REPLY_TO lets clients reply to Diego.
export const FROM = process.env.SES_FROM ?? 'HNavas Systems <noreply@hnavasystems.com>';
export const NOTIFY_EMAIL = process.env.LEAD_NOTIFY_EMAIL ?? 'hnavasystems@gmail.com';
export const REPLY_TO = process.env.SES_REPLY_TO ?? 'hnavasystems@gmail.com';

const ses = new SESv2Client({ region: REGION });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isEmail = (s) => typeof s === 'string' && EMAIL_RE.test(s.trim());

// Public, absolute asset URLs for the email shell (emails can't use local files).
const LOGO_URL = process.env.EMAIL_LOGO_URL ?? 'https://hnavasystems.com/logos/logo-email.png';
const SITE_URL = 'https://hnavasystems.com';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/**
 * Render a branded email matching the website ("Professional Futurist": warm
 * near-black surfaces, cyan brand accent, wordmark logo). Table-based + inline
 * styles for broad email-client support. Returns both HTML and a plain-text
 * fallback so every client gets something readable.
 *
 * @param {{heading:string, paragraphs?:string[], details?:{label:string,value:string}[],
 *          button?:{label:string,url:string}, preheader?:string}} opts
 * @returns {{html:string, text:string}}
 */
export function renderEmail({
  heading, paragraphs = [], details = [], button, preheader,
}) {
  const paras = paragraphs
    .map(
      (p) => `<p style="margin:0 0 14px;color:rgba(255,255,255,0.72);font-size:15px;line-height:1.6;">${esc(p)}</p>`,
    )
    .join('');

  const detailRows = details
    .map(
      (d) => `<tr><td style="padding:5px 0;color:#9aa0ab;font-size:13px;">${esc(d.label)}</td>`
        + `<td style="padding:5px 0;color:#ffffff;font-size:13px;font-weight:600;text-align:right;">${esc(d.value)}</td></tr>`,
    )
    .join('');
  const detailBox = details.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background:#15151f;border:1px solid rgba(255,255,255,0.07);border-radius:10px;"><tr><td style="padding:12px 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${detailRows}</table></td></tr></table>`
    : '';

  const buttonHtml = button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 2px;"><tr><td style="border-radius:10px;background:#22d3ee;"><a href="${esc(
      button.url,
    )}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:700;color:#03121a;text-decoration:none;border-radius:10px;">${esc(button.label)}</a></td></tr></table>`
    : '';

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#07070b;">${
  preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>` : ''
}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#07070b;padding:32px 16px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#0f0f17;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
<tr><td style="padding:26px 28px 10px;" align="left"><img src="${LOGO_URL}" alt="HNavas Systems" height="46" style="height:46px;display:block;border:0;"></td></tr>
<tr><td style="height:3px;background:linear-gradient(90deg,#22d3ee,#0891b2);font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:24px 28px 26px;font-family:Arial,Helvetica,sans-serif;">
<h1 style="margin:0 0 14px;color:#ffffff;font-size:20px;font-weight:700;">${esc(heading)}</h1>
${paras}${detailBox}${buttonHtml}
</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid rgba(255,255,255,0.07);font-family:Arial,Helvetica,sans-serif;">
<p style="margin:0;color:rgba(255,255,255,0.4);font-size:12px;line-height:1.5;">HNavas Systems · Full-Stack &amp; Cloud Engineering · Denver, CO<br><a href="${SITE_URL}" style="color:#22d3ee;text-decoration:none;">hnavasystems.com</a></p>
</td></tr></table></td></tr></table></body></html>`;

  const lines = [heading, '', ...paragraphs];
  if (details.length) lines.push('', ...details.map((d) => `${d.label}: ${d.value}`));
  if (button) lines.push('', `${button.label}: ${button.url}`);
  lines.push('', '— HNavas Systems · hnavasystems.com');
  return { html, text: lines.join('\n') };
}

/**
 * Send a transactional email through SES.
 * @param {{to:string|string[], subject:string, text:string, html?:string, replyTo?:string}} opts
 * @returns {Promise<{ok:boolean, messageId?:string, error?:string}>}
 */
export async function sendEmail({
  to, subject, text, html, replyTo = REPLY_TO,
}) {
  const toAddrs = (Array.isArray(to) ? to : [to]).filter(isEmail);
  if (!toAddrs.length || !subject || !text) return { ok: false, error: 'invalid-email-args' };

  try {
    const res = await ses.send(
      new SendEmailCommand({
        FromEmailAddress: FROM,
        Destination: { ToAddresses: toAddrs },
        ReplyToAddresses: replyTo ? [replyTo] : undefined,
        Content: {
          Simple: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: {
              Text: { Data: text, Charset: 'UTF-8' },
              ...(html ? { Html: { Data: html, Charset: 'UTF-8' } } : {}),
            },
          },
        },
      }),
    );
    return { ok: true, messageId: res.MessageId };
  } catch (err) {
    console.error('SES sendEmail failed:', err?.message ?? err);
    return { ok: false, error: 'send-failed' };
  }
}
