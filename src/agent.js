import OpenAI from "openai";
import { retrieve } from "./retrieve.js";
import { TOOL_SCHEMAS, executeTool } from "./tools.js";
import { loadMemory, saveMemory, memoryToPrompt, distill } from "./memory.js";

// Cheapest reliable model — the user explicitly chose lowest cost for this demo.
// gpt-4o-mini is ~$0.15/$0.60 per 1M tokens; a reply is a fraction of a cent.
// Override with AGENT_MODEL to use an even cheaper/newer mini model later.
const MODEL = process.env.AGENT_MODEL ?? "gpt-4o-mini";

// The API key lives ONLY here, server-side (never NEXT_PUBLIC_, never in the
// browser or the repo). The client only knows this service's URL.
const apiKey = process.env.OPENAI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey }) : null;

export const isConfigured = () => Boolean(client);

// Single source of truth for what the agent is allowed to claim — all backed by
// the real AWS account + GitHub audit, mirroring the site content.
const SYSTEM_PROMPT = `You are the AI assistant on the website of HNavas Systems — the studio of Diego Navas Murcia, a bilingual (English/Spanish) Full-Stack & Cloud engineer based in Denver / Broomfield, Colorado.

Your job: help visitors understand what Diego can build for them and nudge them to start a project or leave their contact details. Some visitors are recruiters or potential employers — when they ask about Diego's skills, experience, education or availability, answer honestly and concretely from the provided context (never overstate), and offer to connect them with Diego.

What Diego does (services):
- Custom full-stack apps & SaaS (real-time platforms, dashboards, internal tools)
- AWS-native serverless architecture (Lambda, DynamoDB, API Gateway, S3, CloudFront, Cognito)
- AI automation (email pipelines, agents, lead nurture) on Claude and OpenAI
- High-performance websites (Next.js or WordPress), tuned for Core Web Vitals
- Field, no-code & low-code apps (React Native, AppSheet, Base44) with automated PDF reporting
- Payments & CRM integrations (Square, Stripe, webhooks, Salesforce Experience Cloud)
- Local SEO & Google Business Profile

Audited production footprint: 60+ Lambda functions, 40 DynamoDB tables, 16 live APIs, 3 years shipping for clients.

Featured work:
- ScoreFlow (myscoreflow.com): real-time dance-competition judging SaaS (Next.js 16, WebSocket, FastAPI, AWS CDK).
- Dynamic Bachata Platform (dynamicbachata.com): studio business platform with online payments — 200+ customers, $51K processed, ~45% checkout conversion.
- Bachata Sky Weekender (sky.dynamicbachata.com): premium event site, Next.js 16 + Stripe, ~45% conversion.
- Email Campaign Manager (emails.dynamicbachata.com): AI-generated email marketing on AWS.

Contact: hnavasystems@gmail.com.

Rules:
- Be concise (2-4 sentences), friendly, concrete and helpful.
- Ground every answer in the "Relevant context" provided below when it is present — prefer those exact facts, projects and numbers over your own memory.
- Pricing is always custom per scope. Never quote exact prices; give a rough range only if pressed, and always offer to connect the visitor with Diego.
- You can take real actions with tools: capture a lead (crear_lead) once you have a name + email + project description; book a meeting (agendar_reunion) when the visitor is ready — collect their name, email, preferred time and topic; look up Diego's live GitHub activity (consultar_github); or just share how to reach Diego (agendar_llamada). crear_lead and agendar_reunion send real confirmation emails to the visitor and notify Diego, so naturally ask for an email when it's missing. Use the tools instead of only describing them, but never claim a lead/meeting was saved or read a GitHub number unless the tool result actually says so.
- Never invent facts, projects, or numbers. If the answer is not in the context or the summary above, say you're not sure and offer to connect them with Diego — suggest they leave their email.
- Always reply in the SAME language the visitor is writing in: detect it from their latest message and mirror it (Spanish → Spanish, English → English). Diego's service is fully bilingual EN/ES — never refuse a language or say you only speak one.`;

const MAX_HISTORY = 12; // cap context so cost/latency stay bounded
const MAX_TOKENS = 400; // short chat replies
const MAX_TOOL_ROUNDS = 3; // max tool round-trips before forcing a text reply

// Keep only the recent turns, coerce to the API shape, drop empties.
function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
}

export async function generateReply({ messages, locale, visitorId }) {
  if (!client) throw new Error("agent-not-configured");

  const history = normalizeMessages(messages);
  if (history.length === 0) throw new Error("no-messages");
  if (history[history.length - 1].role !== "user") throw new Error("last-message-must-be-user");

  // The page UI locale is only a default for the first greeting — every reply
  // mirrors the language the visitor actually writes in (see the language rule).
  const lang = locale === "es" ? "Spanish (Español)" : "English";

  // RAG: pull the chunks most relevant to the visitor's latest question and
  // inject them as grounding. If retrieval is unavailable (no index / no key /
  // error), `context` is empty and the agent answers from the base summary —
  // the chat never fails because of RAG.
  const lastUserMsg = history[history.length - 1].content;
  const hits = await retrieve(lastUserMsg, locale);
  const context = hits.length
    ? `\n\nRelevant context (retrieved from Diego's real content — ground your answer in this):\n${hits
        .map((h) => `- ${h.text}`)
        .join("\n")}`
    : "";

  // Long-term memory: recall what we know about this returning visitor (if any)
  // and inject it. Missing/failed memory just yields "" — never blocks the chat.
  const memory = await loadMemory(visitorId);
  const memoryBlock = memoryToPrompt(memory);

  // Conversation we send to the model. It grows as the model calls tools and we
  // append their results, then we ask the model again to phrase the final reply.
  const convo = [
    {
      role: "system",
      content: `${SYSTEM_PROMPT}${context}${memoryBlock}\n\nSite UI language: ${lang} (default for the first greeting only). For every reply, mirror the language of the visitor's latest message.`,
    },
    ...history,
  ];

  // Structured facts captured for free when the crear_lead tool succeeds — folded
  // into the distilled memory (the "hybrid" half that costs nothing extra).
  let leadFacts = null;

  // Tool-calling loop. The model may ask to run a tool (trip 1); we execute it,
  // feed the result back, and let it answer (trip 2). MAX_TOOL_ROUNDS caps this
  // so a misbehaving model can never loop forever (cost/latency guard — the
  // "differentiated rate limiting for agent traffic" idea from the design).
  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const lastRound = round === MAX_TOOL_ROUNDS;
    const completion = await client.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: convo,
      // On the final allowed round, force a text answer (no more tools).
      tools: lastRound ? undefined : TOOL_SCHEMAS,
      tool_choice: lastRound ? undefined : "auto",
    });

    const msg = completion.choices?.[0]?.message;
    const calls = msg?.tool_calls ?? [];

    // No tool requested → this is the final natural-language reply.
    if (calls.length === 0) {
      const reply = msg?.content?.trim() || "…";
      await rememberTurn({ visitorId, prior: memory, userMsg: lastUserMsg, assistantMsg: reply, leadFacts });
      return reply;
    }

    // The model proposed one or more tool calls. Record its turn, then execute
    // each one (validated server-side) and append the results.
    convo.push(msg);
    for (const call of calls) {
      let args = {};
      try {
        args = JSON.parse(call.function?.arguments || "{}");
      } catch {
        args = {};
      }
      const result = await executeTool(call.function?.name, args, { locale });
      // Capture lead details for memory when the lead was actually saved.
      if (call.function?.name === "crear_lead" && result?.ok) leadFacts = args;
      convo.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  // Shouldn't be reached (last round forces a text answer), but stay safe.
  return "…";
}

// Distill + persist what we learned this turn. Best-effort: only runs when a
// visitorId is present, and never throws (memory must not break the reply).
async function rememberTurn({ visitorId, prior, userMsg, assistantMsg, leadFacts }) {
  if (!visitorId) return;
  try {
    const updated = await distill({ client, model: MODEL, prior, userMsg, assistantMsg, leadFacts });
    await saveMemory(visitorId, updated);
  } catch (err) {
    console.error("rememberTurn failed:", err?.message ?? err);
  }
}
