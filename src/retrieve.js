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

import OpenAI from "openai";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// MUST match the model used in build.mjs — vectors from different models live
// in different spaces and are not comparable.
const EMBED_MODEL = process.env.EMBED_MODEL ?? "text-embedding-3-small";
const TOP_K = Number(process.env.RAG_TOP_K ?? 5); // how many chunks to return
const MIN_SCORE = Number(process.env.RAG_MIN_SCORE ?? 0.2); // drop weak matches

const apiKey = process.env.OPENAI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey }) : null;

// ── Load the index once, defensively. ───────────────────────────────────────
let INDEX = null;
try {
  const here = dirname(fileURLToPath(import.meta.url));
  const raw = readFileSync(join(here, "knowledge", "knowledge.json"), "utf8");
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed.records) && parsed.records.length) {
    INDEX = parsed;
    if (parsed.model !== EMBED_MODEL) {
      console.warn(
        `⚠ knowledge.json was built with "${parsed.model}" but EMBED_MODEL is "${EMBED_MODEL}". Rebuild with: npm run build:knowledge`,
      );
    }
  } else {
    console.warn("⚠ knowledge.json has no records — RAG disabled until you run: npm run build:knowledge");
  }
} catch {
  console.warn("⚠ knowledge.json not found — RAG disabled until you run: npm run build:knowledge");
}

export const isRagReady = () => Boolean(INDEX && client);

// ── Cosine similarity: the angle between two vectors, in [-1, 1].
// Higher = more similar in meaning. This is the Sim(q, e(M_i)) from the design.
function cosine(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Return the most relevant knowledge chunks for a question.
 * @param {string} question  The visitor's latest message.
 * @param {string} locale    "en" | "es" — restricts results to that language.
 * @returns {Promise<Array<{ id:string, category:string, text:string, score:number }>>}
 */
export async function retrieve(question, locale = "en") {
  if (!isRagReady() || typeof question !== "string" || !question.trim()) return [];

  let queryVec;
  try {
    const res = await client.embeddings.create({ model: EMBED_MODEL, input: question.slice(0, 2000) });
    queryVec = res.data[0]?.embedding;
  } catch (err) {
    console.error("retrieve embedding failed:", err?.message ?? err);
    return []; // agent answers without context rather than failing the request
  }
  if (!queryVec) return [];

  const lang = locale === "es" ? "es" : "en";

  return INDEX.records
    .filter((r) => r.locale === lang)
    .map((r) => ({ id: r.id, category: r.category, text: r.text, score: cosine(queryVec, r.vector) }))
    .filter((r) => r.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);
}
