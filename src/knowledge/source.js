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
    en: "HNavas Systems is the studio of Diego Navas Murcia, a bilingual (English/Spanish) Full-Stack & Cloud Engineer based in Denver, Colorado, with three years building software that runs in production. He works natively with AWS (Lambda, DynamoDB, SES, S3, CloudFront, Cognito, API Gateway) and builds automation directly against the Claude and OpenAI APIs. Being bilingual EN/ES lets him serve Denver's businesses and its Hispanic market without losing anything in translation. Contact: hnavasystems@gmail.com.",
    es: 'HNavas Systems es el estudio de Diego Navas Murcia, ingeniero Full-Stack & Cloud bilingüe (inglés/español) basado en Denver, Colorado, con tres años construyendo software que corre en producción. Trabaja de forma nativa con AWS (Lambda, DynamoDB, SES, S3, CloudFront, Cognito, API Gateway) y construye automatización directamente contra las APIs de Claude y OpenAI. Ser bilingüe EN/ES le permite atender a los negocios de Denver y a su mercado hispano sin perder nada en la traducción. Contacto: hnavasystems@gmail.com.',
  },
  {
    id: 'service-areas-colorado',
    category: 'brand',
    en: 'Service areas in Colorado: HNavas Systems provides custom software development, AWS cloud systems and AI automation across the entire Denver Metro area and Colorado. Key cities served include Denver (Downtown, RiNo, Cherry Creek, Tech Center), Boulder, Lakewood, Aurora (including Anschutz Medical Campus), Broomfield (Interlocken), Westminster, Arvada, Thornton, and Centennial. Diego works in-person locally when helpful and remotely across Colorado and the United States.',
    es: 'Áreas de servicio en Colorado: HNavas Systems ofrece desarrollo de software a medida, sistemas en la nube AWS y automatización con IA en toda el área metropolitana de Denver y Colorado. Las principales ciudades atendidas incluyen Denver (Downtown, RiNo, Cherry Creek, Tech Center), Boulder, Lakewood, Aurora (incluyendo Anschutz Medical Campus), Broomfield (Interlocken), Westminster, Arvada, Thornton y Centennial. Diego trabaja en persona localmente cuando ayuda y de forma remota en todo Colorado y Estados Unidos.',
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
    id: 'project-fence-houston',
    category: 'project',
    en: 'Project — Fence Installation Houston (mypetary.com, 2026), a bilingual (EN/ES) lead-generation site for fence installation and repair across Greater Houston: 84 pages of city, service, cost and permit guides covering 26 cities, a fence cost calculator and a two-step quote form that delivers every request by email. It brought in its first real customer request two weeks after launch. Stack: Next.js 16 static export, S3 + CloudFront, CloudFront Functions, Lambda, DynamoDB, SES.',
    es: 'Proyecto — Fence Installation Houston (mypetary.com, 2026), un sitio bilingüe (EN/ES) de captación de clientes para instalación y reparación de cercas en el área de Houston: 84 páginas de ciudades, servicios, costos y permisos que cubren 26 ciudades, una calculadora de precio y un formulario de cotización en dos pasos que entrega cada solicitud por correo. Recibió su primera solicitud real de un cliente dos semanas después del lanzamiento. Stack: Next.js 16 con export estático, S3 + CloudFront, CloudFront Functions, Lambda, DynamoDB, SES.',
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
    en: 'About Diego (recruiter/hiring context): Diego Alejandro Navas Murcia is a Full-Stack & Cloud Engineer and founder/lead developer of HNavas Systems, with about 3 years of experience (early/mid-career). Based in Denver, Colorado. Native Spanish, professional English. Open to full-stack, frontend, backend and AI-integration roles — remote or Denver-area hybrid, contract or full-time. LinkedIn: linkedin.com/in/diegonamu. GitHub: github.com/diegomur09.',
    es: 'Sobre Diego (contexto reclutador/contratación): Diego Alejandro Navas Murcia es Ingeniero Full-Stack & Cloud y fundador/desarrollador principal de HNavas Systems, con unos 3 años de experiencia (inicio/media carrera). Vive en Denver, Colorado. Español nativo, inglés profesional. Abierto a roles full-stack, frontend, backend e integración de IA — remoto o híbrido en Denver, por contrato o tiempo completo. LinkedIn: linkedin.com/in/diegonamu. GitHub: github.com/diegomur09.',
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
    id: 'experience-dynamic-dance',
    category: 'profile',
    en: "Diego's experience at Dynamic Dance Company LLC, Co-Founder & Lead Developer (Denver, Feb 2024 to present): he leads development of the studio's AWS platform (Lambda, DynamoDB, Cognito, SES, CloudWatch) with Square payments and subscriptions, built together with a second developer: 200+ customers and $51K processed across 864 transactions in 9 months. He fixed a Square webhook race that gave customers two packages per charge (9 customers, 13 extra packages) with an order-level lock, then cleaned up the production data. He built LLM automation on the Claude and OpenAI APIs for lead capture and support routing (100+ inbound leads), and grew the studio site to #2 on Google for 'bachata classes Denver' with technical SEO and structured data.",
    es: "Experiencia de Diego en Dynamic Dance Company LLC, Co-Fundador y Desarrollador Principal (Denver, feb 2024 a hoy): lidera el desarrollo de la plataforma del estudio en AWS (Lambda, DynamoDB, Cognito, SES, CloudWatch) con pagos y suscripciones en Square, construida junto con un segundo desarrollador: más de 200 clientes y $51K procesados en 864 transacciones en 9 meses. Corrigió una condición de carrera en los webhooks de Square que daba dos paquetes por un solo cobro (9 clientes, 13 paquetes de más) con un bloqueo por orden, y luego limpió los datos de producción. Construyó automatización con LLM sobre las APIs de Claude y OpenAI para captar leads y enrutar soporte (más de 100 leads entrantes), y llevó el sitio del estudio al #2 en Google para 'bachata classes Denver' con SEO técnico y datos estructurados.",
  },
  {
    id: 'experience-salesforce',
    category: 'profile',
    en: "Diego's Salesforce experience: Salesforce Consultant (contract, remote, Jul 2026 to present) for an enterprise mining-technology company (the client is not named publicly). He led the engagement from RFP response and SOW through contract, kickoff, stakeholder check-ins, UAT, go-live and handover to the client's support team. He built a bilingual (EN/ES) customer support portal on Experience Cloud; configured Service Cloud case management end to end (Email-to-Case, a shared support queue, assignment rules and a bilingual resolved-case email); wrote a 24-test UAT script with English and Spanish customer personas and closed every finding before written sign-off; shipped the build as versioned release packages with Salesforce CLI (Metadata API); and took the portal live in production in October 2026.",
    es: 'Experiencia de Diego en Salesforce: Consultor de Salesforce (contrato, remoto, jul 2026 a hoy) para una empresa enterprise de tecnología para minería (el cliente no se nombra públicamente). Dirigió el proyecto desde la respuesta al RFP y el SOW hasta el contrato, el kickoff, el seguimiento con los interesados, las pruebas de aceptación (UAT), la salida a producción y la entrega al equipo de soporte del cliente. Construyó un portal de soporte bilingüe (EN/ES) en Experience Cloud; configuró la gestión de casos de Service Cloud de punta a punta (Email-to-Case, una cola de soporte compartida, reglas de asignación y un correo bilingüe de caso resuelto); escribió un guion de UAT de 24 pruebas con personas en inglés y español y cerró todos los hallazgos antes de la aprobación por escrito; entregó el trabajo como paquetes versionados con Salesforce CLI (Metadata API); y puso el portal en producción en octubre de 2026.',
  },
  {
    id: 'experience-consulting',
    category: 'profile',
    en: "Diego's consulting and earlier experience. Cloud & Full-Stack Engineer at HNavas Systems, his independent consulting practice (Denver, Jun 2023 to present): he builds and ships full-stack web apps and payment integrations (Next.js, TypeScript, Python/FastAPI on AWS Lambda, DynamoDB, CloudFront) for service, automotive and hospitality clients, including a chauffeur booking platform on Base44 (React plus 56 serverless functions) with Square payments, Stripe Connect driver payouts and Google Maps, plus MFA, rate limiting and encryption of drivers' bank data. He runs 77 Lambda functions, 54 DynamoDB tables and 18 APIs (production and QA environments counted together), defined as code with AWS CDK and CloudFormation. Earlier and in parallel: Engineering Technician at Terracon Consultants (Denver, Apr 2023 to Mar 2026).",
    es: 'Experiencia de Diego como consultor y anterior. Ingeniero Cloud y Full-Stack en HNavas Systems, su práctica de consultoría independiente (Denver, jun 2023 a hoy): construye y entrega apps web full-stack e integraciones de pago (Next.js, TypeScript, Python/FastAPI sobre AWS Lambda, DynamoDB, CloudFront) para clientes de servicios, automotriz y hospitalidad, entre ellas una plataforma de reservas de chofer en Base44 (React y 56 funciones serverless) con pagos en Square, pagos a conductores con Stripe Connect y Google Maps, además de MFA, límite de peticiones y cifrado de los datos bancarios de los conductores. Opera 77 funciones Lambda, 54 tablas DynamoDB y 18 APIs (contando juntos los entornos de producción y QA), definidas como código con AWS CDK y CloudFormation. Antes y en paralelo: Técnico de Ingeniería en Terracon Consultants (Denver, abr 2023 a mar 2026).',
  },
  {
    id: 'education-certs',
    category: 'profile',
    en: "Diego's education & certifications: Software Engineering Certificate from TripleTen (full-stack software engineering, Jan 2024 to Jun 2026); AWS Certified Solutions Architect, Associate (in progress, 2026); Google Career Certificate in Cybersecurity (2023); Fundamentals of Cybersecurity & Python 3 (Codecademy); B.S. in Civil Engineering, Pontificia Bolivariana University, Bucaramanga, Colombia.",
    es: 'Educación y certificaciones de Diego: Certificado de Ingeniería de Software de TripleTen (ingeniería de software full-stack, ene 2024 a jun 2026); AWS Certified Solutions Architect, Associate (en progreso, 2026); Certificado profesional de Ciberseguridad de Google (2023); Fundamentos de Ciberseguridad y Python 3 (Codecademy); Ingeniería Civil, Universidad Pontificia Bolivariana, Bucaramanga, Colombia.',
  },
  {
    id: 'recruiter-faq',
    category: 'profile',
    en: 'Honest answers to recruiter questions about Diego (never overstate). Work authorization: authorized to work in the U.S., no visa sponsorship needed now or in the future. Location and hours: Denver, Colorado, Mountain Time; open to remote (U.S.) or Denver-area hybrid, contract or full-time. Experience level: 3 years of professional software engineering (since June 2023), early/mid-career; his edge is shipping real production products with real users and metrics, not years. Degree: B.S. in Civil Engineering plus a full-stack Software Engineering certificate (TripleTen, 2026); no Computer Science degree. Salesforce: less than one year (since July 2026), configuration and admin of Service Cloud and Experience Cloud, no Salesforce certifications and no Apex or LWC. Mobile: no native iOS or Android and no shipped React Native app; his mobile work is responsive web apps and no-code field apps (AppSheet, Base44). Kubernetes: no production K8s; he uses Docker and Docker Compose. Testing: writes automated tests (pytest, moto) and is deepening TDD and code review. Observability: AWS CloudWatch in production. C++ or game engines: not his background. Salary: aligned with the Colorado mid-level market, flexible by role. For anything not covered, offer to connect them with Diego.',
    es: 'Respuestas honestas a preguntas de reclutadores sobre Diego (nunca exagerar). Permiso de trabajo: autorizado para trabajar en EE. UU., no necesita patrocinio de visa ni ahora ni en el futuro. Ubicación y horario: Denver, Colorado, hora de la montaña; abierto a remoto (EE. UU.) o híbrido en Denver, por contrato o tiempo completo. Nivel de experiencia: 3 años de ingeniería de software profesional (desde junio de 2023), inicio/media carrera; su ventaja es haber lanzado productos reales en producción con usuarios y métricas, no los años. Título: Ingeniería Civil más un certificado de Ingeniería de Software full-stack (TripleTen, 2026); no tiene título en Ciencias de la Computación. Salesforce: menos de un año (desde julio de 2026), configuración y administración de Service Cloud y Experience Cloud, sin certificaciones de Salesforce y sin Apex ni LWC. Móvil: sin iOS ni Android nativos y sin apps publicadas en React Native; su trabajo móvil son apps web responsive y apps de campo no-code (AppSheet, Base44). Kubernetes: sin K8s en producción; usa Docker y Docker Compose. Testing: escribe pruebas automatizadas (pytest, moto) y está profundizando en TDD y revisión de código. Observabilidad: AWS CloudWatch en producción. C++ o motores de juego: no es su área. Salario: alineado con el mercado mid-level de Colorado, flexible según el rol. Para lo no cubierto, ofrece conectar con Diego.',
  },
  {
    id: 'strengths',
    category: 'profile',
    en: "Diego's strengths and differentiators: ships real, production products end-to-end with real users and metrics (not tutorial projects); strong on AWS serverless, real-time systems, payments and AI/LLM integration; entrepreneurial ownership (built and runs a real business's tech stack); bilingual EN/ES and a clear communicator who explains technology to non-technical people.",
    es: 'Fortalezas y diferenciadores de Diego: lanza productos reales en producción de punta a punta, con usuarios y métricas reales (no proyectos de tutorial); fuerte en serverless de AWS, sistemas en tiempo real, pagos e integración de IA/LLM; mentalidad emprendedora (construyó y opera la tecnología de un negocio real); bilingüe EN/ES y comunicador claro que explica la tecnología a personas no técnicas.',
  },

  // ── Role fit: one profile per job type, from the verified CV fact bank ───
  // (~/projects/Cvs/cvs/seed.py, corrected wordings only; client unnamed)
  {
    id: 'role-fit-backend',
    category: 'role-fit',
    en: 'Role fit for Backend Engineer and Cloud Engineer roles (backend, cloud, Python, serverless, AWS): Diego designs, ships and operates serverless systems on AWS, with 77 Lambda functions, 54 DynamoDB tables and 18 APIs (production and QA environments counted together), defined as code with AWS CDK and CloudFormation. He leads development of the payments platform behind Dynamic Bachata (200+ customers, $51K processed in 9 months) and built ScoreFlow, a real-time judging SaaS on FastAPI and WebSockets. He owns systems end to end, from the data model and Cognito auth to webhooks, monitoring and production fixes, for example an order-level lock that stopped a Square webhook race from giving customers two packages per charge.',
    es: 'Encaje para roles de Backend Engineer y Cloud Engineer (backend, cloud, Python, serverless, AWS): Diego diseña, entrega y opera sistemas serverless en AWS, con 77 funciones Lambda, 54 tablas DynamoDB y 18 APIs (contando juntos los entornos de producción y QA), definidas como código con AWS CDK y CloudFormation. Lidera el desarrollo de la plataforma de pagos de Dynamic Bachata (más de 200 clientes, $51K procesados en 9 meses) y construyó ScoreFlow, un SaaS de jueceo en tiempo real con FastAPI y WebSockets. Se encarga de los sistemas de punta a punta, desde el modelo de datos y la autenticación con Cognito hasta los webhooks, el monitoreo y los arreglos en producción, por ejemplo un bloqueo por orden que evitó que una condición de carrera en los webhooks de Square diera dos paquetes por un solo cobro.',
  },
  {
    id: 'role-fit-fullstack',
    category: 'role-fit',
    en: 'Role fit for Full-Stack Engineer and Software Engineer roles (React, Next.js, TypeScript, AWS): Diego ships production web products with Next.js, React, TypeScript and Python on AWS. He leads development of the platform behind Dynamic Bachata (200+ customers, $51K in payments in 9 months), built ScoreFlow, a real-time judging SaaS over WebSockets used live at a 21-competitor, 9-judge event with 135 scores, and a Base44 booking platform with Square, Stripe Connect and Google Maps integrations. He also builds LLM features on the Claude and OpenAI APIs, including the bilingual RAG agent on hnavasystems.com.',
    es: 'Encaje para roles de Full-Stack Engineer y Software Engineer (React, Next.js, TypeScript, AWS): Diego entrega productos web en producción con Next.js, React, TypeScript y Python sobre AWS. Lidera el desarrollo de la plataforma de Dynamic Bachata (más de 200 clientes, $51K en pagos en 9 meses), construyó ScoreFlow, un SaaS de jueceo en tiempo real con WebSockets usado en vivo en un evento de 21 competidores, 9 jueces y 135 puntajes, y una plataforma de reservas en Base44 con integraciones de Square, Stripe Connect y Google Maps. También construye funciones con LLM sobre las APIs de Claude y OpenAI, entre ellas el agente RAG bilingüe de hnavasystems.com.',
  },
  {
    id: 'role-fit-salesforce',
    category: 'role-fit',
    en: 'Role fit for Salesforce roles (Salesforce Consultant, Service Cloud or Experience Cloud admin): Diego led a Service Cloud and Experience Cloud implementation for an enterprise mining-technology company (client not named publicly), with a bilingual customer portal, Email-to-Case, queues and assignment rules, a customer access model with private org-wide defaults and sharing sets, UAT with bilingual personas and a production go-live in October 2026. He ships changes as versioned releases with Salesforce CLI (Metadata API) and SOQL scripts. Honest scope: Salesforce since July 2026, no certifications, configuration rather than Apex or LWC, backed by 3 years as a full-stack AWS engineer comfortable with integrations, data and APIs.',
    es: 'Encaje para roles de Salesforce (Salesforce Consultant, administración de Service Cloud o Experience Cloud): Diego dirigió una implementación de Service Cloud y Experience Cloud para una empresa enterprise de tecnología para minería (el cliente no se nombra públicamente), con un portal bilingüe para clientes, Email-to-Case, colas y reglas de asignación, un modelo de acceso con valores predeterminados privados y sharing sets, UAT con personas bilingües y salida a producción en octubre de 2026. Entrega los cambios como versiones con Salesforce CLI (Metadata API) y scripts SOQL. Alcance honesto: Salesforce desde julio de 2026, sin certificaciones, configuración y no Apex ni LWC, respaldado por 3 años como ingeniero full-stack en AWS con soltura en integraciones, datos y APIs.',
  },
  {
    id: 'role-fit-solutions',
    category: 'role-fit',
    en: "Role fit for Solutions Engineer, Implementation Engineer and Technical Consultant roles: Diego takes projects from first call to go-live. He led a Salesforce engagement for an enterprise mining-technology company from RFP response and SOW through contract, kickoff, UAT and handover while building the solution himself, including a licensing analysis showing the portal fit the client's existing licenses with no added cost, and a written change order that kept the agreed fee and go-live date. He has 3 years building production systems on AWS and integrating Square, Stripe Connect, Google Maps and Salesforce, and explains technical trade-offs to non-technical stakeholders in English and Spanish.",
    es: 'Encaje para roles de Solutions Engineer, Implementation Engineer y Technical Consultant: Diego lleva los proyectos desde la primera llamada hasta la salida a producción. Dirigió un proyecto de Salesforce para una empresa enterprise de tecnología para minería desde la respuesta al RFP y el SOW hasta el contrato, el kickoff, las pruebas de aceptación y la entrega, construyendo él mismo la solución, con un análisis de licencias que mostró que el portal cabía en las licencias que el cliente ya tenía sin costo extra, y una orden de cambio por escrito que mantuvo el precio y la fecha acordados. Tiene 3 años construyendo sistemas en producción en AWS e integrando Square, Stripe Connect, Google Maps y Salesforce, y explica decisiones técnicas a personas no técnicas en inglés y español.',
  },
  {
    id: 'role-fit-qa',
    category: 'role-fit',
    en: 'Role fit for QA Engineer, SDET and Test Engineer roles: Diego has 3 years of hands-on ownership of production quality across AWS systems, payment integrations and real-time SaaS. He tests failure paths in integrations he does not control (payment timeouts, malformed webhook payloads, email delivery failures), traces defects from logs to root cause and validates releases in production. He writes automated tests (pytest, moto), wrote and ran a 24-test bilingual UAT script with a client team, and sorts feedback from non-technical staff into defects, change requests and training gaps.',
    es: 'Encaje para roles de QA Engineer, SDET y Test Engineer: Diego tiene 3 años haciéndose cargo de la calidad en producción de sistemas en AWS, integraciones de pago y SaaS en tiempo real. Prueba los casos de falla en integraciones que no controla (pagos que expiran, webhooks mal formados, correos que no se entregan), rastrea los defectos desde los logs hasta la causa y valida las versiones en producción. Escribe pruebas automatizadas (pytest, moto), escribió y dirigió un guion de UAT bilingüe de 24 pruebas con el equipo de un cliente, y clasifica los comentarios del personal no técnico en defectos, solicitudes de cambio y necesidades de capacitación.',
  },
  {
    id: 'role-fit-fde',
    category: 'role-fit',
    en: "Role fit for Forward Deployed Engineer, Applied AI and AI Solutions roles: Diego builds in front of the customer. He led a Salesforce engagement for an enterprise mining-technology company from RFP through go-live (October 2026) and hypercare while building the solution himself, and profiled the client's historical support cases with SOQL to scope AI options (knowledge base, case clustering and routing). He ships production systems on AWS with Python, TypeScript and Next.js, builds LLM features on the Claude and OpenAI APIs (including a bilingual RAG agent with function-calling tools and per-visitor memory), and launched bilingual lead-generation microsites (78 and 80 pages) with automated production checks.",
    es: 'Encaje para roles de Forward Deployed Engineer, Applied AI y AI Solutions: Diego construye frente al cliente. Dirigió un proyecto de Salesforce para una empresa enterprise de tecnología para minería desde el RFP hasta la salida a producción (octubre de 2026) y el acompañamiento posterior, construyendo él mismo la solución, y analizó el historial de casos de soporte del cliente con SOQL para dimensionar opciones de IA (base de conocimiento, agrupación y enrutamiento de casos). Entrega sistemas en producción en AWS con Python, TypeScript y Next.js, construye funciones con LLM sobre las APIs de Claude y OpenAI (entre ellas un agente RAG bilingüe con herramientas y memoria por visitante) y lanzó micrositios bilingües de captación de clientes (de 78 y 80 páginas) con revisiones automáticas en producción.',
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
