// ─────────────────────────────────────────────────────────────────────────────
// SPEECH: reads the agent's replies aloud with Amazon Polly (neural voices).
//
// COST GUARD: /speak only speaks text this API wrote. Every /chat reply comes
// with a speakToken (an HMAC of the exact reply text); /speak refuses any text
// whose token does not match, so the endpoint can't be used as free
// text-to-speech for arbitrary input. The key is derived from JWT_SECRET, so a
// speech token can never pass as a login token (and no new env var is needed).
//
// Polly bills per character (~$16 per 1M on the neural engine); MAX_CHARS caps
// what one reply can cost. The Lambda role needs polly:SynthesizeSpeech
// (inline policy hnavas-agent-polly-speak).
// ─────────────────────────────────────────────────────────────────────────────

import { createHmac, timingSafeEqual } from 'node:crypto';
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';
import { jwtSecret, region } from './config.js';

const polly = new PollyClient({ region });

// Neural voices chosen by Diego on 3 Nov 2026 (both US, both in us-east-1).
const VOICES = { es: 'Pedro', en: 'Matthew' };
const MAX_CHARS = 1500;

const key = createHmac('sha256', jwtSecret).update('hnavas-speak-v1').digest();

export const signReply = (text) => createHmac('sha256', key).update(text).digest('base64url');

export function isSignedReply(text, token) {
  const expected = Buffer.from(signReply(String(text ?? '')));
  const given = Buffer.from(String(token ?? ''));
  return given.length === expected.length && timingSafeEqual(given, expected);
}

// The agent replies in the visitor's language, which can differ from the page
// locale, so the voice is chosen from the reply itself: whichever language has
// more clues (accents, ñ, ¿ ¡ and very common words) wins.
export function detectLang(text) {
  const es = (text.match(/[áéíóúñ¿¡]|\b(que|para|con|los|las|una|del|puedo|tu)\b/gi) ?? []).length;
  const en = (text.match(/\b(the|and|you|with|for|your|can|is|are)\b/gi) ?? []).length;
  return es > en ? 'es' : 'en';
}

// Markdown symbols and long URLs read badly aloud: keep link text, replace
// bare URLs with a short phrase, drop formatting characters.
export function toSpeakable(text, lang) {
  const link = lang === 'es' ? 'el enlace en pantalla' : 'the link on screen';
  return text
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '$1')
    .replace(/https?:\/\/\S+/g, link)
    .replace(/[*_`#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_CHARS);
}

/**
 * Speak an agent reply. Returns the MP3 as base64 (JSON-friendly through the
 * Lambda Function URL) plus the language used.
 * @param {string} text  A reply already verified with isSignedReply.
 * @returns {Promise<{audio: string, lang: 'es'|'en'}>}
 */
export async function synthesize(text) {
  const lang = detectLang(text);
  const out = await polly.send(new SynthesizeSpeechCommand({
    Engine: 'neural',
    OutputFormat: 'mp3',
    VoiceId: VOICES[lang],
    Text: toSpeakable(text, lang),
  }));
  const bytes = await out.AudioStream.transformToByteArray();
  return { audio: Buffer.from(bytes).toString('base64'), lang };
}
