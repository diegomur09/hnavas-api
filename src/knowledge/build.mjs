// ─────────────────────────────────────────────────────────────────────────────
// KNOWLEDGE INDEXER — run ONCE (or whenever source.js changes).
//
//   node --env-file=.env src/knowledge/build.mjs
//   (or: npm run build:knowledge)
//
// What it does (the "indexing" step of RAG):
//   1. Reads every chunk from source.js (one per project/service/topic).
//   2. Asks OpenAI for the embedding (a 1536-number vector) of each chunk,
//      separately for its English and Spanish text.
//   3. Writes them all to knowledge.json — the searchable index.
//
// This runs offline, not on every request, so each visitor question only pays
// for ONE embedding (its own), never re-embedding the whole knowledge base.
//
// Cost: ~42 short chunks ≈ a few thousand tokens at $0.02 / 1M tokens for
// text-embedding-3-small → a fraction of a cent per full rebuild.
// ─────────────────────────────────────────────────────────────────────────────

import OpenAI from "openai";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { CHUNKS } from "./source.js";

// Must match the model used at query time in retrieve.js — embeddings from
// different models are NOT comparable (different spaces entirely).
const EMBED_MODEL = process.env.EMBED_MODEL ?? "text-embedding-3-small";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "knowledge.json");

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error(
    "✖ OPENAI_API_KEY is not set. Put it in backend/.env and run:\n" +
      "    node --env-file=.env src/knowledge/build.mjs",
  );
  process.exit(1);
}

const client = new OpenAI({ apiKey });

// Flatten chunks into one record per (chunk, locale). Each becomes its own
// point in the knowledge space so EN questions match EN text and ES → ES.
const records = [];
for (const c of CHUNKS) {
  records.push({ id: `${c.id}#en`, chunkId: c.id, category: c.category, locale: "en", text: c.en });
  records.push({ id: `${c.id}#es`, chunkId: c.id, category: c.category, locale: "es", text: c.es });
}

console.log(`Embedding ${records.length} records with ${EMBED_MODEL}…`);

// One batched call — the embeddings endpoint accepts an array of inputs and
// returns vectors in the same order. Cheaper and faster than N calls.
const res = await client.embeddings.create({
  model: EMBED_MODEL,
  input: records.map((r) => r.text),
});

const index = {
  model: EMBED_MODEL,
  dimensions: res.data[0]?.embedding.length ?? 0,
  builtAt: new Date().toISOString(),
  records: records.map((r, i) => ({
    id: r.id,
    chunkId: r.chunkId,
    category: r.category,
    locale: r.locale,
    text: r.text,
    vector: res.data[i].embedding,
  })),
};

await writeFile(OUT, JSON.stringify(index));
console.log(
  `✔ Wrote ${OUT}\n  ${index.records.length} vectors · ${index.dimensions} dims · model ${index.model}`,
);
