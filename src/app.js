import express from 'express';
import cors from 'cors';
import { errors } from 'celebrate';
import { corsOrigin } from './config.js';
import rateLimit from './middlewares/rate-limit.js';
import errorHandler from './middlewares/error-handler.js';
import { validateChat, validateContact } from './middlewares/validation.js';
import { health, chat, contact } from './controllers/agent.js';
import router from './routes/index.js';

const app = express();

app.use(express.json({ limit: '64kb' }));
app.use(cors({
  origin: corsOrigin,
  methods: ['POST', 'GET', 'DELETE', 'OPTIONS'],
}));

// Public site endpoints (anonymous visitors): status, AI chat, contact form.
app.get('/health', health);
app.post('/chat', rateLimit, validateChat, chat);
app.post('/contact', rateLimit, validateContact, contact);

// Auth + lead-inbox API (signup/signin public, the rest behind JWT).
app.use(router);

// celebrate validation errors → 400 with field details.
app.use(errors());
// Everything else → the centralized error handler.
app.use(errorHandler);

export default app;
