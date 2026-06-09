// ─────────────────────────────────────────────────────────────────────────────
// KNOWLEDGE SOURCE — the agent's "notes" (apuntes).
//
// This is the single, human-authored source of truth the RAG agent retrieves
// from. Every fact here is pulled verbatim from the site's own content
// (frontend/src/lib/site.ts + frontend/messages/{en,es}.json) — nothing is
// invented. Keep each chunk short and self-contained (one project / one
// service / one topic), so retrieval can return just the relevant pieces.
//
// HOW IT FLOWS:
//   source.js (this file)  ──build.mjs──▶  knowledge.json (text + vectors)
//   knowledge.json         ──retrieve.js──▶  top-k chunks for a question
//
// To change what the agent knows: edit a chunk here, then re-run
//   npm run build:knowledge
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Chunk
 * @property {string} id        Stable identifier (used for debugging/citations).
 * @property {string} category  Grouping label (brand | stats | service | project | process).
 * @property {string} en        English text to embed + retrieve.
 * @property {string} es        Spanish text to embed + retrieve.
 */

/** @type {Chunk[]} */
export const CHUNKS = [
  // ── Brand / who Diego is ──────────────────────────────────────────────────
  {
    id: "brand",
    category: "brand",
    en: "HNavas Systems is the studio of Diego Navas Murcia, a bilingual (English/Spanish) Full-Stack & Cloud Engineer based in Denver / Broomfield, Colorado, with three years building software that runs in production. He works natively with AWS (Lambda, DynamoDB, SES, S3, CloudFront, Cognito, API Gateway) and builds automation directly against the Claude and OpenAI APIs. Being bilingual EN/ES lets him serve Denver's businesses and its Hispanic market without losing anything in translation. Contact: hnavasystems@gmail.com.",
    es: "HNavas Systems es el estudio de Diego Navas Murcia, ingeniero Full-Stack & Cloud bilingüe (inglés/español) basado en Denver / Broomfield, Colorado, con tres años construyendo software que corre en producción. Trabaja de forma nativa con AWS (Lambda, DynamoDB, SES, S3, CloudFront, Cognito, API Gateway) y construye automatización directamente contra las APIs de Claude y OpenAI. Ser bilingüe EN/ES le permite atender a los negocios de Denver y a su mercado hispano sin perder nada en la traducción. Contacto: hnavasystems@gmail.com.",
  },

  // ── Production footprint / headline stats ─────────────────────────────────
  {
    id: "footprint",
    category: "stats",
    en: "Audited production footprint: 60+ AWS Lambda functions, 40 DynamoDB tables, 16 live APIs, and 3 years shipping for clients. These are real, in-production numbers backed by the actual AWS account.",
    es: "Footprint de producción auditado: 60+ funciones AWS Lambda, 40 tablas DynamoDB, 16 APIs activas y 3 años entregando para clientes. Son números reales en producción, respaldados por la cuenta AWS real.",
  },

  // ── Services (7) ──────────────────────────────────────────────────────────
  {
    id: "service-fullstack",
    category: "service",
    en: "Service — Custom Full-Stack & SaaS: end-to-end web apps and MVPs, including real-time platforms, dashboards and internal tools, from idea to deployed product. Proof: ScoreFlow (real-time, WebSocket, role-based access).",
    es: "Servicio — Full-Stack & SaaS a medida: apps web y MVPs completos, incluyendo plataformas en tiempo real, dashboards y herramientas internas, de la idea al producto desplegado. Prueba: ScoreFlow (tiempo real, WebSocket, acceso por roles).",
  },
  {
    id: "service-cloud",
    category: "service",
    en: "Service — AWS-Native Architecture: serverless design, cloud migration and cost optimization with Lambda, DynamoDB, API Gateway, S3 and CloudFront. Proof: 60+ Lambdas and 40 tables running in production today.",
    es: "Servicio — Arquitectura AWS-native: diseño serverless, migración a la nube y optimización de costos con Lambda, DynamoDB, API Gateway, S3 y CloudFront. Prueba: 60+ Lambdas y 40 tablas corriendo en producción hoy.",
  },
  {
    id: "service-ai",
    category: "service",
    en: "Service — AI Automation: personalized email pipelines, content generation, chatbots and lead-nurture flows built directly on the Claude and OpenAI APIs. Proof: an AI re-engagement system using Claude Haiku + Amazon SES on a daily cron.",
    es: "Servicio — Automatización con IA: pipelines de email personalizado, generación de contenido, chatbots y flujos de nurture construidos directo sobre las APIs de Claude y OpenAI. Prueba: un sistema de re-engagement con IA usando Claude Haiku + Amazon SES en cron diario.",
  },
  {
    id: "service-web",
    category: "service",
    en: "Service — High-Performance Websites: conversion-focused landing pages and redesigns tuned for Core Web Vitals in Next.js or WordPress. Proof: ~45% checkout conversion and major LCP improvements.",
    es: "Servicio — Sitios de alto rendimiento: landing pages y rediseños enfocados en conversión y optimizados para Core Web Vitals en Next.js o WordPress. Prueba: ~45% de conversión en checkout y mejoras grandes de LCP.",
  },
  {
    id: "service-mobile",
    category: "service",
    en: "Service — Field, No-Code & Low-Code Apps: apps that replace paper for construction, inspections and logistics — custom mobile (React Native) or fast no-code/low-code on AppSheet and Base44, with automated reporting. Proof: an AppSheet field app across 100+ properties with automatic PDF reports.",
    es: "Servicio — Apps de campo, no-code & low-code: apps que reemplazan el papel en construcción, inspecciones y logística — móvil a medida (React Native) o rápidas en no-code/low-code con AppSheet y Base44, con reportes automáticos. Prueba: una app de campo en AppSheet cubriendo 100+ propiedades con reportes PDF automáticos.",
  },
  {
    id: "service-integrations",
    category: "service",
    en: "Service — Payments & CRM Integrations: Square payments, webhooks, Salesforce Experience Cloud and customer self-service portals connected end to end. Proof: Square payments processed for 200+ customers.",
    es: "Servicio — Integraciones de pagos & CRM: pagos con Square, webhooks, Salesforce Experience Cloud y portales de autoservicio conectados de punta a punta. Prueba: pagos con Square procesados para 200+ clientes.",
  },
  {
    id: "service-seo",
    category: "service",
    en: "Service — Local SEO & Google Business: local SEO, Google Business Profile and technical SEO/GEO so customers and AI assistants can find you. A low-cost recurring entry point that compounds over time.",
    es: "Servicio — SEO local & Google Business: SEO local, Google Business Profile y SEO técnico/GEO para que clientes y asistentes de IA te encuentren. Un punto de entrada recurrente y económico que crece con el tiempo.",
  },

  // ── Deep expertise: SEO + GEO (distilled from Diego's own research) ────────
  {
    id: "expertise-seo-geo",
    category: "service",
    en: "SEO & GEO approach: for a new or low-authority site, Diego targets terms you can actually win — service + local + long-tail (e.g. 'custom software development Denver') instead of generic, high-competition head terms — plus Spanish-language searches most competitors ignore. GEO (Generative Engine Optimization) makes your business citable by AI assistants (ChatGPT, Gemini, Google AI Overviews) through clean structured data / JSON-LD (Person, Organization, LocalBusiness), fast Core Web Vitals, server-rendered or static pages, and clear answers placed up front. Proof: this very site ships a sitemap, robots, per-locale Open Graph images, JSON-LD and a fast static CloudFront build.",
    es: "Enfoque SEO & GEO: para un sitio nuevo o de baja autoridad, Diego apunta a términos que sí puedes ganar — de servicio + locales + long-tail (ej. 'desarrollo de software a medida Denver') en vez de términos genéricos muy competidos — más búsquedas en español que casi nadie trabaja. El GEO (optimización para motores generativos) logra que los asistentes de IA (ChatGPT, Gemini, Google AI Overviews) te citen, mediante structured data / JSON-LD (Person, Organization, LocalBusiness), Core Web Vitals rápidos, páginas estáticas o renderizadas en servidor, y respuestas claras al inicio. Prueba: este mismo sitio incluye sitemap, robots, imágenes Open Graph por idioma, JSON-LD y un build estático rápido en CloudFront.",
  },

  // ── Deep expertise: AI customer-service / business agents ──────────────────
  {
    id: "expertise-ai-agents",
    category: "service",
    en: "AI agents: Diego builds production AI agents (customer-service and business automation) with a modern, secure architecture — an LLM for reasoning, a RAG loop that grounds every answer in your real content so it doesn't hallucinate, a separate action layer that calls your APIs/CRM safely, and memory for multi-turn, personalized conversations with handoff to a human when needed. Security-first: API keys and secrets are never exposed to the model, access is scoped (OAuth 2.1 / MCP tools), and requests are rate-limited. Live proof: the bilingual agent you're talking to right now — RAG over Diego's real content plus tool-calling, running on AWS Lambda.",
    es: "Agentes de IA: Diego construye agentes de IA de producción (servicio al cliente y automatización de negocio) con arquitectura moderna y segura — un LLM para razonar, un bucle RAG que ancla cada respuesta en tu contenido real para que no alucine, una capa de acción aparte que llama tus APIs/CRM de forma segura, y memoria para conversaciones multiturno y personalizadas con traspaso a un humano cuando hace falta. Seguridad primero: las keys y secretos nunca se exponen al modelo, los accesos son acotados (OAuth 2.1 / herramientas MCP) y las peticiones tienen rate limiting. Prueba viva: el agente bilingüe con el que hablas ahora mismo — RAG sobre el contenido real de Diego más tool-calling, corriendo en AWS Lambda.",
  },

  // ── Projects (10) ─────────────────────────────────────────────────────────
  {
    id: "project-scoreflow",
    category: "project",
    en: "Project — ScoreFlow (myscoreflow.com, 2026), a real-time judging SaaS for dance competitions: live scoreboards, multi-round scoring and role-based access for organizers, judges and competitors. Replaced paper/spreadsheets. Architecture: Next.js 16 SSR on Lambda with a CloudFront origin split (static to S3, dynamic to Lambda); a WebSocket API backed by a DynamoDB connection registry fans out live scores; FastAPI + AWS CDK backend with Cognito auth and isolated prod/QA. Result: a live event with 21 competitors, 9 judges and 135 scores cast in real time. Stack: Next.js 16, React 19, FastAPI, AWS CDK, DynamoDB, WebSocket, Cognito.",
    es: "Proyecto — ScoreFlow (myscoreflow.com, 2026), un SaaS de jueceo en tiempo real para competencias de baile: marcadores en vivo, puntuación por rondas y acceso por roles para organizadores, jueces y competidores. Reemplazó papel y hojas de cálculo. Arquitectura: Next.js 16 con SSR en Lambda y un origin split en CloudFront (estático a S3, dinámico a Lambda); una API WebSocket respaldada por un registro de conexiones en DynamoDB distribuye los puntajes en vivo; backend FastAPI + AWS CDK con auth Cognito y prod/QA aislados. Resultado: un evento en vivo con 21 competidores, 9 jueces y 135 puntajes en tiempo real. Stack: Next.js 16, React 19, FastAPI, AWS CDK, DynamoDB, WebSocket, Cognito.",
  },
  {
    id: "project-dynamic-bachata",
    category: "project",
    en: "Project — Dynamic Bachata Platform (dynamicbachata.com, 2025), a full business platform for a dance studio: online payments, class bookings, automated email and an SEO-tuned site, backed by a 60+ endpoint serverless API. Architecture: a Next.js front end on S3 + CloudFront over a 60+ endpoint AWS Lambda API (DynamoDB, Zod-validated), with Square payments, Amazon SES email and isolated prod/QA. Built as a team effort in collaboration with DevMellio (devmellio.com), a Denver web studio — the backend, ongoing maintenance and SEO/GEO were worked on together. Result: scaled from 0 to 200+ paying customers and $51K processed across 864 transactions in 9 months, with major LCP / Core Web Vitals gains.",
    es: "Proyecto — Plataforma Dynamic Bachata (dynamicbachata.com, 2025), una plataforma de negocio completa para un estudio de baile: pagos en línea, reservas de clases, email automatizado y un sitio optimizado para SEO, respaldada por una API serverless de 60+ endpoints. Arquitectura: un front end en Next.js sobre S3 + CloudFront sobre una API en AWS Lambda de 60+ endpoints (DynamoDB, validada con Zod), con pagos Square, email Amazon SES y prod/QA aislados. Construida como un trabajo en equipo en colaboración con DevMellio (devmellio.com), un estudio web de Denver — el backend, el mantenimiento continuo y el SEO/GEO se trabajaron en conjunto. Resultado: escaló de 0 a 200+ clientes pagos y $51K procesados en 864 transacciones en 9 meses, con mejoras importantes de LCP / Core Web Vitals.",
  },
  {
    id: "project-sky-weekender",
    category: "project",
    en: "Project — Bachata Sky Weekender (sky.dynamicbachata.com, 2026), a premium, high-converting event site for a 3-day Denver bachata weekender: ticket tiers, Stripe checkout and a cinematic, animated experience. Architecture: a statically-exported Next.js 16 site on S3 + CloudFront with Framer Motion + Lenis, backed by an Express/Lambda API on DynamoDB and Stripe Checkout, deployed to prod and QA via GitHub Actions. Result: ~45% checkout conversion with isolated prod/QA pipelines shipping on every push.",
    es: "Proyecto — Bachata Sky Weekender (sky.dynamicbachata.com, 2026), un sitio de evento premium y de alta conversión para un weekender de bachata de 3 días en Denver: niveles de boletos, checkout con Stripe y una experiencia animada y cinematográfica. Arquitectura: un sitio Next.js 16 exportado estático sobre S3 + CloudFront con Framer Motion + Lenis, respaldado por una API Express/Lambda sobre DynamoDB y Stripe Checkout, desplegado a prod y QA con GitHub Actions. Resultado: ~45% de conversión en checkout con pipelines prod/QA aislados que despliegan en cada push.",
  },
  {
    id: "project-email-campaigns",
    category: "project",
    en: "Project — Email Campaign Manager (emails.dynamicbachata.com, 2026), a full email-marketing platform: manage contacts, generate campaigns with AI and automate bulk delivery, built for a studio on AWS. Architecture: a React + Vite app on AWS Amplify behind a Cognito-secured HTTP API, with Node Lambdas drafting copy through OpenRouter AI and sending via Amazon SES — all on DynamoDB with prod/QA isolation. Result: a self-serve tool that drafts AI campaigns and sends them in bulk, replacing a paid email SaaS with owned infrastructure.",
    es: "Proyecto — Email Campaign Manager (emails.dynamicbachata.com, 2026), una plataforma completa de email marketing: gestiona contactos, genera campañas con IA y automatiza el envío masivo, construida para un estudio sobre AWS. Arquitectura: una app React + Vite en AWS Amplify detrás de una HTTP API protegida con Cognito, con Lambdas en Node que redactan copy vía OpenRouter AI y envían por Amazon SES — todo sobre DynamoDB con aislamiento prod/QA. Resultado: una herramienta self-serve que redacta campañas con IA y las envía de forma masiva, reemplazando un SaaS de email de pago con infraestructura propia.",
  },
  {
    id: "project-bachata-crm",
    category: "project",
    en: "Project — Dynamic Bachata CRM (app.hnavasystems.com, 2026), an AI retention CRM for a studio: it tracks students, flags who has gone quiet (a 14–28 day at-risk window) and automatically wins them back with AI-written re-engagement emails on a daily cron. Stack: Next.js, AWS Lambda, Claude Haiku, DynamoDB, SES, EventBridge, Cognito.",
    es: "Proyecto — Dynamic Bachata CRM (app.hnavasystems.com, 2026), un CRM de retención con IA para un estudio: rastrea estudiantes, detecta quién se ha alejado (ventana de riesgo de 14–28 días) y los recupera automáticamente con emails de re-engagement escritos por IA en un cron diario. Stack: Next.js, AWS Lambda, Claude Haiku, DynamoDB, SES, EventBridge, Cognito.",
  },
  {
    id: "project-petary",
    category: "project",
    en: "Project — MyPetary Store (mypetary.com, 2026), a bilingual Amazon-affiliate storefront for men's clothing, perfumes and accessories: a curated catalog with a clean shopping experience, monetized through the Amazon Associates program. Stack: Next.js 15, FastAPI, Lambda, DynamoDB, Stripe, next-intl.",
    es: "Proyecto — MyPetary Store (mypetary.com, 2026), una tienda bilingüe de afiliados de Amazon de ropa, perfumes y accesorios para hombre: un catálogo curado con una experiencia de compra limpia, monetizada con el programa Amazon Associates. Stack: Next.js 15, FastAPI, Lambda, DynamoDB, Stripe, next-intl.",
  },
  {
    id: "project-ccc-field-app",
    category: "project",
    en: "Project — CCC Field App (2025), a no-code AppSheet field app that replaces paper across 100+ properties, capturing structured inspection data and generating PDF reports automatically. Stack: AppSheet, Google Sheets, Apps Script, automated PDF.",
    es: "Proyecto — CCC Field App (2025), una app de campo no-code en AppSheet que reemplaza el papel en 100+ propiedades, capturando datos de inspección estructurados y generando reportes PDF automáticamente. Stack: AppSheet, Google Sheets, Apps Script, PDF automático.",
  },
  {
    id: "project-drilled-pier",
    category: "project",
    en: "Project — Drilled Pier Field App (2026), a custom Expo / React Native field-inspection app feeding an AWS Lambda backend that auto-generates structured PDF reports, with branch-mapped CI/CD. Stack: Expo / React Native, AWS Lambda, GitHub Actions.",
    es: "Proyecto — Drilled Pier Field App (2026), una app de inspección de campo a medida en Expo / React Native que alimenta un backend AWS Lambda que auto-genera reportes PDF estructurados, con CI/CD mapeado por rama. Stack: Expo / React Native, AWS Lambda, GitHub Actions.",
  },
  {
    id: "project-luxury-rides",
    category: "project",
    en: "Project — Luxury Rides Denver (luxuryridesdenver.com, 2025), a luxury car-service site built fast on Base44 (low-code) — proof that Diego matches the tool to the budget, from full custom builds to rapid low-code delivery.",
    es: "Proyecto — Luxury Rides Denver (luxuryridesdenver.com, 2025), un sitio de servicio de autos de lujo construido rápido en Base44 (low-code) — prueba de que Diego ajusta la herramienta al presupuesto, desde builds 100% a medida hasta entrega rápida en low-code.",
  },
  {
    id: "project-baychata",
    category: "project",
    en: "Project — Baychata (baychatafestival.com, 2025), a full WordPress redesign with a plugin overhaul and performance tuning: cut LCP from 14.9s to 4.6s and lifted mobile PageSpeed from 46 to 72 by removing ~182 KiB of render-blocking CSS. Stack: WordPress, PHP, plugins, Core Web Vitals.",
    es: "Proyecto — Baychata (baychatafestival.com, 2025), un rediseño completo en WordPress con renovación de plugins y optimización de rendimiento: bajó el LCP de 14.9s a 4.6s y subió el PageSpeed móvil de 46 a 72 eliminando ~182 KiB de CSS bloqueante. Stack: WordPress, PHP, plugins, Core Web Vitals.",
  },

  // ── Process / pricing / how to start ──────────────────────────────────────
  {
    id: "pricing",
    category: "process",
    en: "Pricing is always custom to the scope of each project — there are no fixed price lists. If pressed, give only a rough range and always offer to connect the visitor with Diego. The best next step is to share a few project details so Diego can scope it; he usually replies within a day.",
    es: "El precio siempre se cotiza a medida según el alcance de cada proyecto — no hay listas de precios fijas. Si insisten, da solo un rango aproximado y siempre ofrece conectar al visitante con Diego. El mejor siguiente paso es compartir algunos detalles del proyecto para que Diego lo cotice; normalmente responde en un día.",
  },
  {
    id: "contact",
    category: "process",
    en: "To start a project, the visitor can leave their name, email and a short description of what they want to build through the contact form, or email hnavasystems@gmail.com directly. Diego works in English or Spanish and usually replies within a day.",
    es: "Para iniciar un proyecto, el visitante puede dejar su nombre, email y una breve descripción de lo que quiere construir a través del formulario de contacto, o escribir directamente a hnavasystems@gmail.com. Diego trabaja en inglés o español y normalmente responde en un día.",
  },
];
