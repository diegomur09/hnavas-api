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

import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const REGION = process.env.AWS_REGION ?? "us-east-1";

// FROM must be on the SES-verified domain (hnavasystems.com). NOTIFY is where
// lead/meeting alerts land (Diego's inbox). REPLY_TO lets clients reply to Diego.
export const FROM = process.env.SES_FROM ?? "HNavas Systems <noreply@hnavasystems.com>";
export const NOTIFY_EMAIL = process.env.LEAD_NOTIFY_EMAIL ?? "hnavasystems@gmail.com";
export const REPLY_TO = process.env.SES_REPLY_TO ?? "hnavasystems@gmail.com";

const ses = new SESv2Client({ region: REGION });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isEmail = (s) => typeof s === "string" && EMAIL_RE.test(s.trim());

/**
 * Send a transactional email through SES.
 * @param {{to:string|string[], subject:string, text:string, html?:string, replyTo?:string}} opts
 * @returns {Promise<{ok:boolean, messageId?:string, error?:string}>}
 */
export async function sendEmail({ to, subject, text, html, replyTo = REPLY_TO }) {
  const toAddrs = (Array.isArray(to) ? to : [to]).filter(isEmail);
  if (!toAddrs.length || !subject || !text) return { ok: false, error: "invalid-email-args" };

  try {
    const res = await ses.send(
      new SendEmailCommand({
        FromEmailAddress: FROM,
        Destination: { ToAddresses: toAddrs },
        ReplyToAddresses: replyTo ? [replyTo] : undefined,
        Content: {
          Simple: {
            Subject: { Data: subject, Charset: "UTF-8" },
            Body: {
              Text: { Data: text, Charset: "UTF-8" },
              ...(html ? { Html: { Data: html, Charset: "UTF-8" } } : {}),
            },
          },
        },
      }),
    );
    return { ok: true, messageId: res.MessageId };
  } catch (err) {
    console.error("SES sendEmail failed:", err?.message ?? err);
    return { ok: false, error: "send-failed" };
  }
}
