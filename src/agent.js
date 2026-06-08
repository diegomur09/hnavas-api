import OpenAI from "openai";

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

Your job: help visitors understand what Diego can build for them and nudge them to start a project or leave their contact details.

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

Contact: diegomurcia2@gmail.com.

Rules:
- Be concise (2-4 sentences), friendly, concrete and helpful.
- Pricing is always custom per scope. Never quote exact prices; give a rough range only if pressed, and always offer to connect the visitor with Diego.
- Never invent facts, projects, or numbers beyond what's above. If you don't know, say so and offer to connect them with Diego — suggest they leave their email.
- Reply ONLY in the visitor's language (provided below).`;

const MAX_HISTORY = 12; // cap context so cost/latency stay bounded
const MAX_TOKENS = 400; // short chat replies

// Keep only the recent turns, coerce to the API shape, drop empties.
function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
}

export async function generateReply({ messages, locale }) {
  if (!client) throw new Error("agent-not-configured");

  const history = normalizeMessages(messages);
  if (history.length === 0) throw new Error("no-messages");
  if (history[history.length - 1].role !== "user") throw new Error("last-message-must-be-user");

  const lang = locale === "es" ? "Spanish (Español)" : "English";

  const completion = await client.chat.completions.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [
      { role: "system", content: `${SYSTEM_PROMPT}\n\nVisitor's language: ${lang}. Reply only in this language.` },
      ...history,
    ],
  });

  const text = completion.choices?.[0]?.message?.content?.trim();
  return text || "…";
}
