// ─────────────────────────────────────────────────────────────────────────────
// MEMORY — long-term, per-visitor memory (Phase 3, Pillar A).
//
// RAG (knowledge) is the same for everyone and read-only. THIS is different:
// it's read/write and specific to each visitor, so a returning visitor is
// recognized ("last time we talked about your plumbing landing page…").
//
// Storage: one DynamoDB table `hnavas-agent-memory`, keyed by visitorId, with
// a TTL so stale profiles auto-expire. The table name defaults in code (no
// Lambda env var needed — avoids touching the function config / the API key).
//
// Distillation is HYBRID: structured facts captured for free from the
// crear_lead tool, plus a short AI-written summary refreshed each turn.
//
// Everything is defensive: any DynamoDB/LLM failure degrades to "no memory"
// rather than breaking the chat.
// ─────────────────────────────────────────────────────────────────────────────

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const TABLE = process.env.MEMORY_TABLE ?? "hnavas-agent-memory";
const REGION = process.env.AWS_REGION ?? "us-east-1";
const TTL_DAYS = 90; // profiles expire 90 days after the last visit
const MAX_FACTS = 8; // keep the profile compact (research: distill, don't dump)

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), {
  marshallOptions: { removeUndefinedValues: true },
});

/**
 * Load a visitor's stored memory.
 * @returns {Promise<{facts:string[], summary:string, updatedAt?:string}|null>}
 */
export async function loadMemory(visitorId) {
  if (!visitorId) return null;
  try {
    const res = await ddb.send(new GetCommand({ TableName: TABLE, Key: { visitorId } }));
    return res.Item ?? null;
  } catch (err) {
    console.error("memory load failed:", err?.message ?? err);
    return null; // agent just runs without memory
  }
}

/** Persist a visitor's memory with a refreshed TTL. */
export async function saveMemory(visitorId, { facts = [], summary = "" } = {}) {
  if (!visitorId) return;
  const ttl = Math.floor(Date.now() / 1000) + TTL_DAYS * 86400;
  try {
    await ddb.send(
      new PutCommand({
        TableName: TABLE,
        Item: {
          visitorId,
          facts: facts.slice(0, MAX_FACTS),
          summary: summary.slice(0, 600),
          updatedAt: new Date().toISOString(),
          ttl,
        },
      }),
    );
  } catch (err) {
    console.error("memory save failed:", err?.message ?? err);
  }
}

/** Turn stored memory into a short block for the system prompt (or ""). */
export function memoryToPrompt(mem) {
  if (!mem || (!mem.summary && !(mem.facts?.length))) return "";
  const facts = mem.facts?.length ? `\nKnown facts:\n${mem.facts.map((f) => `- ${f}`).join("\n")}` : "";
  const summary = mem.summary ? `\n${mem.summary}` : "";
  return `\n\nWhat you remember about this RETURNING visitor (greet them accordingly, don't re-ask what you already know):${summary}${facts}`;
}

/**
 * Distill updated memory from prior memory + the latest exchange (hybrid:
 * also folds in structured lead facts when present). Returns {facts, summary}.
 * On any error, returns the prior memory unchanged.
 */
export async function distill({ client, model, prior, userMsg, assistantMsg, leadFacts }) {
  const base = { facts: prior?.facts ?? [], summary: prior?.summary ?? "" };
  if (!client) return base;

  const lead = leadFacts
    ? `\nSTRUCTURED (from lead capture, treat as confirmed): ${JSON.stringify(leadFacts)}`
    : "";

  try {
    const completion = await client.chat.completions.create({
      model,
      max_tokens: 220,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'You maintain a concise memory profile of a returning website visitor for a sales agent. ' +
            'Given the PRIOR memory and the LATEST exchange, output the UPDATED memory as JSON: ' +
            '{"facts": string[], "summary": string}. Rules: facts are short, stable, deduplicated bullets ' +
            '(name, business/industry, preferred language, budget, what they want to build, email if shared) — ' +
            'max 8. summary is 1-2 sentences on who they are and what they want. Only include things actually ' +
            'stated; never invent. Merge new info with prior, dropping nothing still relevant. Output ONLY the JSON.',
        },
        {
          role: "user",
          content:
            `PRIOR MEMORY:\nfacts: ${JSON.stringify(base.facts)}\nsummary: ${base.summary || "(none)"}\n\n` +
            `LATEST EXCHANGE:\nVisitor: ${userMsg}\nAgent: ${assistantMsg}${lead}`,
        },
      ],
    });

    const parsed = JSON.parse(completion.choices?.[0]?.message?.content ?? "{}");
    const facts = Array.isArray(parsed.facts) ? parsed.facts.filter((f) => typeof f === "string") : base.facts;
    const summary = typeof parsed.summary === "string" ? parsed.summary : base.summary;
    return { facts, summary };
  } catch (err) {
    console.error("memory distill failed:", err?.message ?? err);
    return base; // keep prior memory
  }
}
