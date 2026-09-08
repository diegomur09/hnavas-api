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
    id: 'brand',
    category: 'brand',
    en: "HNavas Systems is the studio of Diego Navas Murcia, a bilingual (English/Spanish) Full-Stack & Cloud Engineer based in Denver / Broomfield, Colorado, with three years building software that runs in production. He works natively with AWS (Lambda, DynamoDB, SES, S3, CloudFront, Cognito, API Gateway) and builds automation directly against the Claude and OpenAI APIs. Being bilingual EN/ES lets him serve Denver's businesses and its Hispanic market without losing anything in translation. Contact: hnavasystems@gmail.com.",
    es: 'HNavas Systems es el estudio de Diego Navas Murcia, ingeniero Full-Stack & Cloud bilingüe (inglés/español) basado en Denver / Broomfield, Colorado, con tres años construyendo software que corre en producción. Trabaja de forma nativa con AWS (Lambda, DynamoDB, SES, S3, CloudFront, Cognito, API Gateway) y construye automatización directamente contra las APIs de Claude y OpenAI. Ser bilingüe EN/ES le permite atender a los negocios de Denver y a su mercado hispano sin perder nada en la traducción. Contacto: hnavasystems@gmail.com.',
  },

  // ── Production footprint / headline stats ─────────────────────────────────
  {
    id: 'footprint',
    category: 'stats',
    en: 'Audited production footprint: 60+ AWS Lambda functions, 40 DynamoDB tables, 16 live APIs, and 3 years shipping for clients. These are real, in-production numbers backed by the actual AWS account.',
    es: 'Footprint de producción auditado: 60+ funciones AWS Lambda, 40 tablas DynamoDB, 16 APIs activas y 3 años entregando para clientes. Son números reales en producción, respaldados por la cuenta AWS real.',
  },

  // ── Services (7) ──────────────────────────────────────────────────────────
  {
    id: 'service-fullstack',
    category: 'service',
    en: 'Service — Custom Full-Stack & SaaS: end-to-end web apps and MVPs, including real-time platforms, dashboards and internal tools, from idea to deployed product. Proof: ScoreFlow (real-time, WebSocket, role-based access).',
    es: 'Servicio — Full-Stack & SaaS a medida: apps web y MVPs completos, incluyendo plataformas en tiempo real, dashboards y herramientas internas, de la idea al producto desplegado. Prueba: ScoreFlow (tiempo real, WebSocket, acceso por roles).',
  },
  {
    id: 'service-cloud',
    category: 'service',
    en: 'Service — AWS-Native Architecture: serverless design, cloud migration and cost optimization with Lambda, DynamoDB, API Gateway, S3 and CloudFront. Proof: 60+ Lambdas and 40 tables running in production today.',
    es: 'Servicio — Arquitectura AWS-native: diseño serverless, migración a la nube y optimización de costos con Lambda, DynamoDB, API Gateway, S3 y CloudFront. Prueba: 60+ Lambdas y 40 tablas corriendo en producción hoy.',
  },
  {
    id: 'service-ai',
    category: 'service',
    en: 'Service — AI Automation: personalized email pipelines, content generation, chatbots and lead-nurture flows built directly on the Claude and OpenAI APIs. Proof: an AI re-engagement system using Claude Haiku + Amazon SES on a daily cron.',
    es: 'Servicio — Automatización con IA: pipelines de email personalizado, generación de contenido, chatbots y flujos de nurture construidos directo sobre las APIs de Claude y OpenAI. Prueba: un sistema de re-engagement con IA usando Claude Haiku + Amazon SES en cron diario.',
  },
  {
    id: 'service-web',
    category: 'service',
    en: 'Service — High-Performance Websites: conversion-focused landing pages and redesigns tuned for Core Web Vitals in Next.js or WordPress. Proof: ~45% checkout conversion and major LCP improvements.',
    es: 'Servicio — Sitios de alto rendimiento: landing pages y rediseños enfocados en conversión y optimizados para Core Web Vitals en Next.js o WordPress. Prueba: ~45% de conversión en checkout y mejoras grandes de LCP.',
  },
  {
    id: 'service-mobile',
    category: 'service',
    en: 'Service — Field, No-Code & Low-Code Apps: apps that replace paper for construction, inspections and logistics — custom mobile (React Native) or fast no-code/low-code on AppSheet and Base44, with automated reporting. Proof: an AppSheet field app across 100+ properties with automatic PDF reports.',
    es: 'Servicio — Apps de campo, no-code & low-code: apps que reemplazan el papel en construcción, inspecciones y logística — móvil a medida (React Native) o rápidas en no-code/low-code con AppSheet y Base44, con reportes automáticos. Prueba: una app de campo en AppSheet cubriendo 100+ propiedades con reportes PDF automáticos.',
  },
  {
    id: 'service-integrations',
    category: 'service',
    en: 'Service — Payments & CRM Integrations: Square payments, webhooks, Salesforce Experience Cloud and customer self-service portals connected end to end. Proof: Square payments processed for 200+ customers, plus a Salesforce Service Cloud support portal built for an enterprise client.',
    es: 'Servicio — Integraciones de pagos & CRM: pagos con Square, webhooks, Salesforce Experience Cloud y portales de autoservicio conectados de punta a punta. Prueba: pagos con Square procesados para 200+ clientes, y un portal de soporte en Salesforce Service Cloud construido para un cliente enterprise.',
  },
  {
    id: 'service-seo',
    category: 'service',
    en: 'Service — Local SEO & Google Business: local SEO, Google Business Profile and technical SEO/GEO so customers and AI assistants can find you. A low-cost recurring entry point that compounds over time.',
    es: 'Servicio — SEO local & Google Business: SEO local, Google Business Profile y SEO técnico/GEO para que clientes y asistentes de IA te encuentren. Un punto de entrada recurrente y económico que crece con el tiempo.',
  },

  // ── Deep expertise: SEO + GEO (distilled from Diego's own research) ────────
  {
    id: 'expertise-seo-geo',
    category: 'service',
    en: "SEO & GEO approach: for a new or low-authority site, Diego targets terms you can actually win — service + local + long-tail (e.g. 'custom software development Denver') instead of generic, high-competition head terms — plus Spanish-language searches most competitors ignore. GEO (Generative Engine Optimization) makes your business citable by AI assistants (ChatGPT, Gemini, Google AI Overviews) through clean structured data / JSON-LD (Person, Organization, LocalBusiness), fast Core Web Vitals, server-rendered or static pages, and clear answers placed up front. Proof: this very site ships a sitemap, robots, per-locale Open Graph images, JSON-LD and a fast static CloudFront build.",
    es: "Enfoque SEO & GEO: para un sitio nuevo o de baja autoridad, Diego apunta a términos que sí puedes ganar — de servicio + locales + long-tail (ej. 'desarrollo de software a medida Denver') en vez de términos genéricos muy competidos — más búsquedas en español que casi nadie trabaja. El GEO (optimización para motores generativos) logra que los asistentes de IA (ChatGPT, Gemini, Google AI Overviews) te citen, mediante structured data / JSON-LD (Person, Organization, LocalBusiness), Core Web Vitals rápidos, páginas estáticas o renderizadas en servidor, y respuestas claras al inicio. Prueba: este mismo sitio incluye sitemap, robots, imágenes Open Graph por idioma, JSON-LD y un build estático rápido en CloudFront.",
  },

  // ── Deep expertise: AI customer-service / business agents ──────────────────
  {
    id: 'expertise-ai-agents',
    category: 'service',
    en: "AI agents: Diego builds production AI agents (customer-service and business automation) with a modern, secure architecture — an LLM for reasoning, a RAG loop that grounds every answer in your real content so it doesn't hallucinate, a separate action layer that calls your APIs/CRM safely, and memory for multi-turn, personalized conversations with handoff to a human when needed. Security-first: API keys and secrets are never exposed to the model, access is scoped (OAuth 2.1 / MCP tools), and requests are rate-limited. Live proof: the bilingual agent you're talking to right now — RAG over Diego's real content plus tool-calling, running on AWS Lambda.",
    es: 'Agentes de IA: Diego construye agentes de IA de producción (servicio al cliente y automatización de negocio) con arquitectura moderna y segura — un LLM para razonar, un bucle RAG que ancla cada respuesta en tu contenido real para que no alucine, una capa de acción aparte que llama tus APIs/CRM de forma segura, y memoria para conversaciones multiturno y personalizadas con traspaso a un humano cuando hace falta. Seguridad primero: las keys y secretos nunca se exponen al modelo, los accesos son acotados (OAuth 2.1 / herramientas MCP) y las peticiones tienen rate limiting. Prueba viva: el agente bilingüe con el que hablas ahora mismo — RAG sobre el contenido real de Diego más tool-calling, corriendo en AWS Lambda.',
  },

  // ── Projects (11) ─────────────────────────────────────────────────────────
  {
    id: 'project-scoreflow',
    category: 'project',
    en: 'Project — ScoreFlow (myscoreflow.com, 2026), a real-time judging SaaS for dance competitions: live scoreboards, multi-round scoring and role-based access for organizers, judges and competitors. Replaced paper/spreadsheets. Architecture: Next.js 16 SSR on Lambda with a CloudFront origin split (static to S3, dynamic to Lambda); a WebSocket API backed by a DynamoDB connection registry fans out live scores; FastAPI + AWS CDK backend with Cognito auth and isolated prod/QA. Result: a live event with 21 competitors, 9 judges and 135 scores cast in real time. Stack: Next.js 16, React 19, FastAPI, AWS CDK, DynamoDB, WebSocket, Cognito.',
    es: 'Proyecto — ScoreFlow (myscoreflow.com, 2026), un SaaS de jueceo en tiempo real para competencias de baile: marcadores en vivo, puntuación por rondas y acceso por roles para organizadores, jueces y competidores. Reemplazó papel y hojas de cálculo. Arquitectura: Next.js 16 con SSR en Lambda y un origin split en CloudFront (estático a S3, dinámico a Lambda); una API WebSocket respaldada por un registro de conexiones en DynamoDB distribuye los puntajes en vivo; backend FastAPI + AWS CDK con auth Cognito y prod/QA aislados. Resultado: un evento en vivo con 21 competidores, 9 jueces y 135 puntajes en tiempo real. Stack: Next.js 16, React 19, FastAPI, AWS CDK, DynamoDB, WebSocket, Cognito.',
  },
  {
    id: 'project-dynamic-bachata',
    category: 'project',
    en: 'Project — Dynamic Bachata Platform (dynamicbachata.com, 2025), a full business platform for a dance studio: online payments, class bookings, automated email and an SEO-tuned site, backed by a 60+ endpoint serverless API. Architecture: a Next.js front end on S3 + CloudFront over a 60+ endpoint AWS Lambda API (DynamoDB, Zod-validated), with Square payments, Amazon SES email and isolated prod/QA. Built as a team effort in collaboration with DevMellio (devmellio.com), a Denver web studio — the backend, ongoing maintenance and SEO/GEO were worked on together. Result: scaled from 0 to 200+ paying customers and $51K processed across 864 transactions in 9 months, with major LCP / Core Web Vitals gains.',
    es: 'Proyecto — Plataforma Dynamic Bachata (dynamicbachata.com, 2025), una plataforma de negocio completa para un estudio de baile: pagos en línea, reservas de clases, email automatizado y un sitio optimizado para SEO, respaldada por una API serverless de 60+ endpoints. Arquitectura: un front end en Next.js sobre S3 + CloudFront sobre una API en AWS Lambda de 60+ endpoints (DynamoDB, validada con Zod), con pagos Square, email Amazon SES y prod/QA aislados. Construida como un trabajo en equipo en colaboración con DevMellio (devmellio.com), un estudio web de Denver — el backend, el mantenimiento continuo y el SEO/GEO se trabajaron en conjunto. Resultado: escaló de 0 a 200+ clientes pagos y $51K procesados en 864 transacciones en 9 meses, con mejoras importantes de LCP / Core Web Vitals.',
  },
  {
    id: 'project-sky-weekender',
    category: 'project',
    en: 'Project — Bachata Sky Weekender (sky.dynamicbachata.com, 2026), a premium, high-converting event site for a 3-day Denver bachata weekender: ticket tiers, Stripe checkout and a cinematic, animated experience. Architecture: a statically-exported Next.js 16 site on S3 + CloudFront with Framer Motion + Lenis, backed by an Express/Lambda API on DynamoDB and Stripe Checkout, deployed to prod and QA via GitHub Actions. Result: ~45% checkout conversion with isolated prod/QA pipelines shipping on every push.',
    es: 'Proyecto — Bachata Sky Weekender (sky.dynamicbachata.com, 2026), un sitio de evento premium y de alta conversión para un weekender de bachata de 3 días en Denver: niveles de boletos, checkout con Stripe y una experiencia animada y cinematográfica. Arquitectura: un sitio Next.js 16 exportado estático sobre S3 + CloudFront con Framer Motion + Lenis, respaldado por una API Express/Lambda sobre DynamoDB y Stripe Checkout, desplegado a prod y QA con GitHub Actions. Resultado: ~45% de conversión en checkout con pipelines prod/QA aislados que despliegan en cada push.',
  },
  {
    id: 'project-email-campaigns',
    category: 'project',
    en: 'Project — Email Campaign Manager (emails.dynamicbachata.com, 2026), a full email-marketing platform: manage contacts, generate campaigns with AI and automate bulk delivery, built for a studio on AWS. Architecture: a React + Vite app on AWS Amplify behind a Cognito-secured HTTP API, with Node Lambdas drafting copy through OpenRouter AI and sending via Amazon SES — all on DynamoDB with prod/QA isolation. Result: a self-serve tool that drafts AI campaigns and sends them in bulk, replacing a paid email SaaS with owned infrastructure.',
    es: 'Proyecto — Email Campaign Manager (emails.dynamicbachata.com, 2026), una plataforma completa de email marketing: gestiona contactos, genera campañas con IA y automatiza el envío masivo, construida para un estudio sobre AWS. Arquitectura: una app React + Vite en AWS Amplify detrás de una HTTP API protegida con Cognito, con Lambdas en Node que redactan copy vía OpenRouter AI y envían por Amazon SES — todo sobre DynamoDB con aislamiento prod/QA. Resultado: una herramienta self-serve que redacta campañas con IA y las envía de forma masiva, reemplazando un SaaS de email de pago con infraestructura propia.',
  },
  {
    id: 'project-salesforce-portal',
    category: 'project',
    en: "Project — Salesforce Support Portal (2026), a Salesforce Service Cloud and Experience Cloud implementation for an enterprise mining-technology company (the client is not named publicly, so no brand or URL). What it does: support emails become Cases automatically through Email-to-Case, with branded auto-acknowledgements and reply threading; customers open and track their own cases in a self-service Experience Cloud portal; and Cases route to the right support queue. Diego also handled the admin side: user provisioning, profiles and permissions, queue membership, org-wide email addresses, and sandbox to production deployment. Delivery included a scripted UAT the client's own support team ran before sign-off. Stack: Salesforce, Service Cloud, Experience Cloud, Email-to-Case, Flows, sandbox + production orgs. This is Diego's enterprise CRM work, alongside the AWS and AI projects.",
    es: 'Proyecto — Portal de soporte en Salesforce (2026), una implementación de Salesforce Service Cloud y Experience Cloud para una empresa enterprise de tecnología para minería (el cliente no se nombra públicamente, sin marca ni URL). Qué hace: los correos de soporte se convierten en Casos automáticamente vía Email-to-Case, con acuses de recibo con marca y threading de respuestas; los clientes abren y siguen sus propios casos en un portal de autoservicio en Experience Cloud; y los casos se enrutan a la cola de soporte correcta. Diego también se encargó del lado admin: alta de usuarios, perfiles y permisos, membresía de colas, direcciones org-wide y el despliegue de sandbox a producción. La entrega incluyó un UAT guionizado que el propio equipo de soporte del cliente ejecutó antes del sign-off. Stack: Salesforce, Service Cloud, Experience Cloud, Email-to-Case, Flows, orgs sandbox + producción. Este es el trabajo enterprise de CRM de Diego, junto a los proyectos de AWS e IA.',
  },
  {
    id: 'project-bachata-crm',
    category: 'project',
    en: 'Project — Dynamic Bachata CRM (app.hnavasystems.com, 2026), an AI retention CRM for a studio: it tracks students, flags who has gone quiet (a 14–28 day at-risk window) and automatically wins them back with AI-written re-engagement emails on a daily cron. Stack: Next.js, AWS Lambda, Claude Haiku, DynamoDB, SES, EventBridge, Cognito.',
    es: 'Proyecto — Dynamic Bachata CRM (app.hnavasystems.com, 2026), un CRM de retención con IA para un estudio: rastrea estudiantes, detecta quién se ha alejado (ventana de riesgo de 14–28 días) y los recupera automáticamente con emails de re-engagement escritos por IA en un cron diario. Stack: Next.js, AWS Lambda, Claude Haiku, DynamoDB, SES, EventBridge, Cognito.',
  },
  {
    id: 'project-petary',
    category: 'project',
    en: "Project — MyPetary Store (mypetary.com, 2026), a bilingual Amazon-affiliate storefront for men's clothing, perfumes and accessories: a curated catalog with a clean shopping experience, monetized through the Amazon Associates program. Stack: Next.js 15, FastAPI, Lambda, DynamoDB, Stripe, next-intl.",
    es: 'Proyecto — MyPetary Store (mypetary.com, 2026), una tienda bilingüe de afiliados de Amazon de ropa, perfumes y accesorios para hombre: un catálogo curado con una experiencia de compra limpia, monetizada con el programa Amazon Associates. Stack: Next.js 15, FastAPI, Lambda, DynamoDB, Stripe, next-intl.',
  },
  {
    id: 'project-ccc-field-app',
    category: 'project',
    en: 'Project — CCC Field App (2025), a no-code AppSheet field app that replaces paper across 100+ properties, capturing structured inspection data and generating PDF reports automatically. Stack: AppSheet, Google Sheets, Apps Script, automated PDF.',
    es: 'Proyecto — CCC Field App (2025), una app de campo no-code en AppSheet que reemplaza el papel en 100+ propiedades, capturando datos de inspección estructurados y generando reportes PDF automáticamente. Stack: AppSheet, Google Sheets, Apps Script, PDF automático.',
  },
  {
    id: 'project-drilled-pier',
    category: 'project',
    en: 'Project — Drilled Pier Field App (2026), a custom Expo / React Native field-inspection app feeding an AWS Lambda backend that auto-generates structured PDF reports, with branch-mapped CI/CD. Stack: Expo / React Native, AWS Lambda, GitHub Actions.',
    es: 'Proyecto — Drilled Pier Field App (2026), una app de inspección de campo a medida en Expo / React Native que alimenta un backend AWS Lambda que auto-genera reportes PDF estructurados, con CI/CD mapeado por rama. Stack: Expo / React Native, AWS Lambda, GitHub Actions.',
  },
  {
    id: 'project-luxury-rides',
    category: 'project',
    en: 'Project — Luxury Rides Denver (luxuryridesdenver.com, 2025), a luxury car-service site built fast on Base44 (low-code) — proof that Diego matches the tool to the budget, from full custom builds to rapid low-code delivery.',
    es: 'Proyecto — Luxury Rides Denver (luxuryridesdenver.com, 2025), un sitio de servicio de autos de lujo construido rápido en Base44 (low-code) — prueba de que Diego ajusta la herramienta al presupuesto, desde builds 100% a medida hasta entrega rápida en low-code.',
  },
  {
    id: 'project-baychata',
    category: 'project',
    en: 'Project — Baychata (baychatafestival.com, 2025), a full WordPress redesign with a plugin overhaul and performance tuning: cut LCP from 14.9s to 4.6s and lifted mobile PageSpeed from 46 to 72 by removing ~182 KiB of render-blocking CSS. Stack: WordPress, PHP, plugins, Core Web Vitals.',
    es: 'Proyecto — Baychata (baychatafestival.com, 2025), un rediseño completo en WordPress con renovación de plugins y optimización de rendimiento: bajó el LCP de 14.9s a 4.6s y subió el PageSpeed móvil de 46 a 72 eliminando ~182 KiB de CSS bloqueante. Stack: WordPress, PHP, plugins, Core Web Vitals.',
  },

  // ── About Diego (recruiter / hiring context) ──────────────────────────────
  {
    id: 'profile',
    category: 'profile',
    en: 'About Diego (recruiter/hiring context): Diego Alejandro Navas Murcia is a Full-Stack & Cloud Engineer and founder/lead developer of HNavas Systems, with about 3 years of experience (early/mid-career). Based in Broomfield, Denver metro, Colorado. Native Spanish, professional English. Open to full-stack, frontend, backend and AI-integration roles — remote or Denver-area hybrid, contract or full-time. LinkedIn: linkedin.com/in/diegonamu. GitHub: github.com/diegomur09.',
    es: 'Sobre Diego (contexto reclutador/contratación): Diego Alejandro Navas Murcia es Ingeniero Full-Stack & Cloud y fundador/desarrollador principal de HNavas Systems, con unos 3 años de experiencia (inicio/media carrera). Vive en Broomfield, área metropolitana de Denver, Colorado. Español nativo, inglés profesional. Abierto a roles full-stack, frontend, backend e integración de IA — remoto o híbrido en Denver, por contrato o tiempo completo. LinkedIn: linkedin.com/in/diegonamu. GitHub: github.com/diegomur09.',
  },
  {
    id: 'skills-frontend-backend',
    category: 'profile',
    en: "Diego's frontend & backend/cloud skills: React, Next.js, TypeScript, JavaScript (ES6+), Tailwind CSS, Framer Motion, responsive design, WCAG accessibility, Elementor. Backend/cloud: AWS (Lambda, API Gateway, DynamoDB, S3, SES, CloudFront, CloudWatch, Cognito, Route 53), Python/FastAPI, Node.js, REST APIs, WebSocket, serverless and event-driven architecture. Core languages: JavaScript, TypeScript, Python, SQL.",
    es: 'Habilidades frontend y backend/cloud de Diego: React, Next.js, TypeScript, JavaScript (ES6+), Tailwind CSS, Framer Motion, diseño responsive, accesibilidad WCAG, Elementor. Backend/cloud: AWS (Lambda, API Gateway, DynamoDB, S3, SES, CloudFront, CloudWatch, Cognito, Route 53), Python/FastAPI, Node.js, APIs REST, WebSocket, arquitectura serverless y orientada a eventos. Lenguajes principales: JavaScript, TypeScript, Python, SQL.',
  },
  {
    id: 'skills-ai-devops',
    category: 'profile',
    en: "Diego's AI, payments and DevOps skills: AI/automation on the Claude and OpenAI APIs, prompt engineering, LLM-powered automation, webhook pipelines, self-hosted n8n, Twilio SMS. Payments: Square and Stripe (subscriptions, reliable webhooks). DevOps & tools: Docker, Docker Compose, Nginx, SSL, Linux, Bash, Git, GitHub Actions (CI/CD), AWS CDK. SEO/performance: Core Web Vitals, JSON-LD, RankMath, Google Business Profile, local SEO.",
    es: 'Habilidades de IA, pagos y DevOps de Diego: IA/automatización sobre las APIs de Claude y OpenAI, prompt engineering, automatización con LLM, pipelines de webhooks, n8n auto-alojado, Twilio SMS. Pagos: Square y Stripe (suscripciones, webhooks confiables). DevOps y herramientas: Docker, Docker Compose, Nginx, SSL, Linux, Bash, Git, GitHub Actions (CI/CD), AWS CDK. SEO/rendimiento: Core Web Vitals, JSON-LD, RankMath, Google Business Profile, SEO local.',
  },
  {
    id: 'experience',
    category: 'profile',
    en: "Diego's experience. Co-Founder & Lead Developer at Dynamic Dance Company LLC (Feb 2024–present): co-founded the company and built/operates its entire AWS platform — scaled 0 to 200+ customers (160 active students) and $51K processed (864 transactions) in 9 months; built the Square payments + SES email + Lambda engine; diagnosed and fixed 178 failed payment webhooks (missing Lambda signature keys); built Claude/OpenAI automation for lead capture (100+ inbound leads); the studio site ranks #2 on Google for 'bachata classes Denver'. Also an Independent Cloud & Full-Stack Consultant (Jun 2023–present) for service, automotive and hospitality clients.",
    es: "Experiencia de Diego. Co-Fundador y Desarrollador Principal en Dynamic Dance Company LLC (feb 2024–presente): co-fundó la empresa y construyó/opera toda su plataforma en AWS — escaló de 0 a 200+ clientes (160 estudiantes activos) y $51K procesados (864 transacciones) en 9 meses; construyó el motor de pagos Square + email SES + Lambda; diagnosticó y arregló 178 webhooks de pago fallidos (faltaban llaves de firma en Lambda); construyó automatización con Claude/OpenAI para captura de leads (100+ leads entrantes); el sitio del estudio rankea #2 en Google para 'bachata classes Denver'. También Consultor independiente Cloud & Full-Stack (jun 2023–presente) para clientes de servicios, automotriz y hospitalidad.",
  },
  {
    id: 'education-certs',
    category: 'profile',
    en: "Diego's education & certifications: Software Engineering Bootcamp at TripleTen (full-stack, Jan 2024–present); AWS Certified Solutions Architect – Associate (in progress, 2026); Google Career Certificate in Cybersecurity (2023); Fundamentals of Cybersecurity & Python 3 (Codecademy); B.S. in Civil Engineering, Pontificia Bolivariana University, Bucaramanga, Colombia.",
    es: 'Educación y certificaciones de Diego: Bootcamp de Ingeniería de Software en TripleTen (full-stack, ene 2024–presente); AWS Certified Solutions Architect – Associate (en progreso, 2026); Certificado profesional de Ciberseguridad de Google (2023); Fundamentos de Ciberseguridad y Python 3 (Codecademy); Ingeniería Civil, Universidad Pontificia Bolivariana, Bucaramanga, Colombia.',
  },
  {
    id: 'recruiter-faq',
    category: 'profile',
    en: 'Honest answers to recruiter questions about Diego (never overstate): Experience level — about 3 years, early/mid-career; his edge is shipping real production products with real users and metrics, not years. Kubernetes — no production K8s experience; he uses Docker and Docker Compose and is ready to ramp up. Testing/TDD — a growth area he is actively building; he writes tests and is deepening TDD and code-review habits. Observability — uses AWS CloudWatch in production; eager to pick up Datadog. C++/game engines — not his background; he is a web/full-stack & cloud engineer. Availability — Denver metro (Broomfield), open to remote or hybrid, contract or full-time. Salary — aligned with the Colorado mid-level market, flexible by role. For anything not covered, offer to connect them with Diego.',
    es: 'Respuestas honestas a preguntas de reclutadores sobre Diego (nunca exagerar): Nivel de experiencia — unos 3 años, inicio/media carrera; su ventaja es haber lanzado productos reales en producción con usuarios y métricas, no los años. Kubernetes — sin experiencia de K8s en producción; usa Docker y Docker Compose y está listo para aprenderlo. Testing/TDD — un área en crecimiento que construye activamente; escribe pruebas y profundiza en TDD y revisión de código. Observabilidad — usa AWS CloudWatch en producción; con ganas de aprender Datadog. C++/motores de juego — no es su área; es ingeniero web/full-stack y cloud. Disponibilidad — área de Denver (Broomfield), abierto a remoto o híbrido, contrato o tiempo completo. Salario — alineado con el mercado mid-level de Colorado, flexible según el rol. Para lo no cubierto, ofrece conectar con Diego.',
  },
  {
    id: 'strengths',
    category: 'profile',
    en: "Diego's strengths and differentiators: ships real, production products end-to-end with real users and metrics (not tutorial projects); strong on AWS serverless, real-time systems, payments and AI/LLM integration; entrepreneurial ownership (built and runs a real business's tech stack); bilingual EN/ES and a clear communicator who explains technology to non-technical people.",
    es: 'Fortalezas y diferenciadores de Diego: lanza productos reales en producción de punta a punta, con usuarios y métricas reales (no proyectos de tutorial); fuerte en serverless de AWS, sistemas en tiempo real, pagos e integración de IA/LLM; mentalidad emprendedora (construyó y opera la tecnología de un negocio real); bilingüe EN/ES y comunicador claro que explica la tecnología a personas no técnicas.',
  },

  // ── Process / pricing / how to start ──────────────────────────────────────
  {
    id: 'pricing',
    category: 'process',
    en: 'Pricing is always custom to the scope of each project — there are no fixed price lists. If pressed, give only a rough range and always offer to connect the visitor with Diego. The best next step is to share a few project details so Diego can scope it; he usually replies within a day.',
    es: 'El precio siempre se cotiza a medida según el alcance de cada proyecto — no hay listas de precios fijas. Si insisten, da solo un rango aproximado y siempre ofrece conectar al visitante con Diego. El mejor siguiente paso es compartir algunos detalles del proyecto para que Diego lo cotice; normalmente responde en un día.',
  },
  {
    id: 'contact',
    category: 'process',
    en: 'To start a project, the visitor can leave their name, email and a short description of what they want to build through the contact form, or email hnavasystems@gmail.com directly. Diego works in English or Spanish and usually replies within a day.',
    es: 'Para iniciar un proyecto, el visitante puede dejar su nombre, email y una breve descripción de lo que quiere construir a través del formulario de contacto, o escribir directamente a hnavasystems@gmail.com. Diego trabaja en inglés o español y normalmente responde en un día.',
  },
];

export default CHUNKS;
