import { generateReply, isConfigured } from '../agent.js';
import { emailLead } from '../tools.js';
import captureSiteLead from '../services/lead-capture.js';
import { synthesize, isSignedReply, signReply } from '../speech.js';
import { ForbiddenError } from '../errors/index.js';
import { LEAD_SOURCES, MESSAGES } from '../constants.js';

// Public site endpoints: the AI chat and the contact form. No auth — these
// serve anonymous visitors; rate limiting + celebrate validation run first.

export function health(req, res) {
  res.json({ ok: true, agent: isConfigured() ? 'ready' : 'not-configured' });
}

export async function chat(req, res, next) {
  if (!isConfigured()) {
    // Frontend falls back to its built-in demo replies on a non-200.
    res.status(503).json({ error: 'agent-not-configured' });
    return;
  }
  try {
    const { messages, locale, visitorId } = req.body;
    const reply = await generateReply({ messages, locale, visitorId });
    // speakToken lets the site ask /speak to read this exact reply aloud.
    res.json({ reply, speakToken: signReply(reply) });
  } catch (err) {
    next(err); // centralized handler logs it and answers a generic 500
  }
}

// Reads one agent reply aloud (Amazon Polly). Only text carrying a valid
// speakToken from /chat is spoken, so nobody can use this as free TTS.
export async function speak(req, res, next) {
  const { text, token } = req.body;
  if (!isSignedReply(text, token)) {
    next(new ForbiddenError(MESSAGES.NOT_AN_AGENT_REPLY));
    return;
  }
  try {
    res.json(await synthesize(text));
  } catch (err) {
    next(err);
  }
}

export async function contact(req, res, next) {
  try {
    const {
      name, email, project, locale,
    } = req.body;

    // Email Diego + acknowledge the client (branded). emailLead is defensive,
    // so the form never errors because of email delivery.
    await emailLead({
      name, email, project, locale,
    });

    // Also store the lead in the admin's inbox (best-effort, never throws).
    await captureSiteLead({
      name, email, project, locale, source: LEAD_SOURCES.CONTACT_FORM,
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
