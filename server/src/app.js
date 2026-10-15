import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import tasksRouter from './routes/tasks.js';
import activityRouter from './routes/activity.js';
import { errorHandler, notFound } from './errors.js';

/** Builds the Express app. Kept separate from index.js so tests can import it. */
export function createApp() {
  const app = express();

  // Needed so rate limiting sees the real client IP behind Render's proxy.
  app.set('trust proxy', 1);

  app.use(helmet());

  // CLIENT_ORIGIN is a comma-separated allow-list (e.g. the Vercel URL).
  // If it is unset (local dev) any origin is allowed.
  const origins = (process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
  app.use(cors({ origin: origins.length ? origins : true }));

  app.use(express.json({ limit: '50kb' }));
  app.use('/api', rateLimit({ windowMs: 60_000, limit: 600, standardHeaders: 'draft-7', legacyHeaders: false }));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/tasks', tasksRouter);
  app.use('/api/activity', activityRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
