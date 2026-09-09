// ─────────────────────────────────────────────────────────────────────────────
// RETRIEVER — the "search" step of RAG (runs on every visitor question).
//
//   retrieve(question, locale)  →  top-k most relevant chunks of Diego's content
//
// How it works:
//   1. Embed the question into the SAME vector space as the knowledge base.
//   2. Score every stored chunk by cosine similarity (closeness in that space).
//   3. Return the best few, so agent.js can inject only those as context.
//
// Design notes:
//   • knowledge.json is loaded once at startup and kept in memory. At ~42
//     vectors a linear scan is microseconds — no vector database needed yet.
//   • Everything is wrapped so a missing/broken index or a failed embedding
//     call NEVER throws to the caller: retrieve() just returns [] and the agent
//     answers without context (graceful degradation, same spirit as the
//     site's existing demo fallback).
// ─────────────────────────────────────────────────────────────────────────────

import OpenAI from 'openai';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// MUST match the model used in build.mjs — vectors from different models live
// in different spaces and are not comparable.
const EMBED_MODEL = process.env.EMBED_MODEL ?? 'text-embedding-3-small';
const TOP_K = Number(process.env.RAG_TOP_K ?? 5); // how many chunks to return
const MIN_SCORE = Number(process.env.RAG_MIN_SCORE ?? 0.2); // drop weak matches
const SEMANTIC_WEIGHT = Number(process.env.RAG_SEMANTIC_WEIGHT ?? 0.65);
const LEXICAL_WEIGHT = Number(process.env.RAG_LEXICAL_WEIGHT ?? 0.35);
// Absolute raw-BM25 floor. Calibrated against this index: with stopwords
// filtered, off-topic questions ("how do I fix my car engine?", "receta de
// paella") peak at 3.56, while real keyword lookups reach 4.4 (ScoreFlow),
// 5.1 (Petary) and 6.7 (Baychata). 4.0 sits in that gap. Only used to rescue
// or, when embeddings are down, to gate: never as the primary relevance test,
// because scores below it overlap heavily with noise (DynamoDB scores 1.35).
const LEX_MIN = Number(process.env.RAG_LEX_MIN ?? 4);

const apiKey = process.env.OPENAI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey }) : null;

// ── Load the index once, defensively. ───────────────────────────────────────
let INDEX = null;
try {
  const here = dirname(fileURLToPath(import.meta.url));
  const raw = readFileSync(join(here, 'knowledge', 'knowledge.json'), 'utf8');
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed.records) && parsed.records.length) {
    INDEX = parsed;
    if (parsed.model !== EMBED_MODEL) {
      console.warn(
        `⚠ knowledge.json was built with "${parsed.model}" but EMBED_MODEL is "${EMBED_MODEL}". Rebuild with: npm run build:knowledge`,
      );
    }
  } else {
    console.warn('⚠ knowledge.json has no records — RAG disabled until you run: npm run build:knowledge');
  }
} catch {
  console.warn('⚠ knowledge.json not found — RAG disabled until you run: npm run build:knowledge');
}

export const isRagReady = () => Boolean(INDEX);

// ── Cosine similarity: the angle between two vectors, in [-1, 1].
// Higher = more similar in meaning. This is the Sim(q, e(M_i)) from the design.
function cosine(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

// ── Lexical Search (BM25) ───────────────────────────────────────────────────
// Question words carry no topic signal but do match nearly every chunk, which
// used to let "what is the weather in Tokyo tomorrow?" outscore "do you work
// with AWS?". Dropping them moved the off-topic median from 4.82 to 0.
const STOPWORDS = new Set(`
a about al algo alguna algunas alguno algunos ante antes as at be been being but by can como con contra cual
cuales cuando de del desde do does doing donde dos el ella ellas ellos en entre era eran es esa esas ese eso
esos esta estas este esto estos for from fue fueron ha hace hacer han has hasta have having he her here hers
him his how i if in into is it its la las le les lo los mas me mi mis much my no nos nosotros o of on or otra
otras otro otros para pero poco por porque que quien se sea ser si sin sobre son su sus tan te tener tengo
the their them then there these they this those to un una uno unos up us was we were what when where which
while who why will with without y ya yo you your
`.trim().split(/\s+/));

// Tokenizes text down to clean keywords. Accents are stripped so a Spanish
// question about "automatización" still matches a chunk written the same way
// but typed without the accent, in either direction.
export function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

// Computes BM25 lexical relevance score for each candidate document.
export function computeBm25(query, docs) {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return docs.map(() => 0);

  const docTokens = docs.map((d) => tokenize(`${d.text} ${d.chunkId || ''} ${d.category || ''}`));
  const N = docs.length;
  if (N === 0) return [];

  const avgdl = docTokens.reduce((sum, t) => sum + t.length, 0) / N;
  const k1 = 1.2;
  const b = 0.75;

  const idf = {};
  for (let i = 0; i < qTokens.length; i += 1) {
    const t = qTokens[i];
    if (!idf[t]) {
      const docCount = docTokens.filter((dt) => dt.includes(t)).length;
      idf[t] = Math.log((N - docCount + 0.5) / (docCount + 0.5) + 1);
    }
  }

  return docTokens.map((dt, i) => {
    let score = 0;
    const docLen = dt.length;
    for (let j = 0; j < qTokens.length; j += 1) {
      const t = qTokens[j];
      const tf = dt.filter((w) => w === t).length;
      if (tf > 0) {
        const idfVal = idf[t] || 0;
        const num = tf * (k1 + 1);
        const denom = tf + k1 * (1 - b + b * (docLen / (avgdl || 1)));
        let termScore = idfVal * (num / denom);
        // Boost if the keyword matches chunkId directly (e.g. "scoreflow", "fastapi")
        if (docs[i].chunkId && docs[i].chunkId.toLowerCase().includes(t)) {
          termScore *= 1.5;
        }
        score += termScore;
      }
    }
    return score;
  });
}

/**
 * Return the most relevant knowledge chunks using Hybrid Search (Semantic + Lexical).
 * @param {string} question  The visitor's latest message.
 * @param {string} locale    "en" | "es" — restricts results to that language.
 * @returns {Promise<Array<{ id:string, category:string, text:string, score:number }>>}
 */
export async function retrieve(question, locale = 'en') {
  if (!INDEX || typeof question !== 'string' || !question.trim()) return [];

  const lang = locale === 'es' ? 'es' : 'en';
  const candidates = INDEX.records.filter((r) => r.locale === lang);
  if (candidates.length === 0) return [];

  // 1. Lexical Scoring (BM25) — fast, in-memory, zero API latency.
  const rawLexScores = computeBm25(question, candidates);
  const maxLex = Math.max(...rawLexScores, 0);
  const normLexScores = rawLexScores.map((s) => (maxLex > 0 ? s / maxLex : 0));

  // 2. Semantic Scoring (Embeddings via OpenAI)
  let queryVec = null;
  if (client) {
    try {
      const res = await client.embeddings.create({
        model: EMBED_MODEL,
        input: question.slice(0, 2000),
      });
      queryVec = res.data[0]?.embedding;
    } catch (err) {
      console.error('retrieve embedding failed (falling back to lexical):', err?.message ?? err);
    }
  }

  // 3. Hybrid fusion. Two separate questions, deliberately kept apart:
  //
  //    is this chunk relevant at all?  -> absolute scores only
  //    which relevant chunk goes first? -> the blended score
  //
  // Normalising the lexical score divides by the best match in the set, so the
  // top chunk always lands on 1.0 no matter how weak it really is. That is fine
  // for ordering and wrong for a threshold: it is what made a question about
  // the weather in Tokyo retrieve the contact chunk with a perfect score.
  // Relevance is therefore decided on the semantic score, which is the only
  // signal that understands meaning, with a high absolute BM25 as a rescue for
  // exact names the embedding can miss.
  return candidates
    .map((r, i) => {
      const hasVector = Boolean(queryVec) && Array.isArray(r.vector);
      const semScore = hasVector ? Math.max(0, cosine(queryVec, r.vector)) : 0;
      const rawLex = rawLexScores[i];

      const relevant = hasVector
        ? semScore >= MIN_SCORE || rawLex >= LEX_MIN
        // Embeddings unavailable: keep only unambiguous keyword hits. Anything
        // weaker returns nothing and the agent answers from its base summary,
        // which is the documented degraded behaviour.
        : rawLex >= LEX_MIN;

      return {
        id: r.id,
        category: r.category,
        text: r.text,
        relevant,
        score: Number((
          (SEMANTIC_WEIGHT * semScore) + (LEXICAL_WEIGHT * normLexScores[i])
        ).toFixed(4)),
      };
    })
    .filter((r) => r.relevant)
    .map(({ relevant, ...r }) => r)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);
}
