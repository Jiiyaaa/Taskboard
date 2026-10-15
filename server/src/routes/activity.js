import { Router } from 'express';
import { Activity } from '../models/Activity.js';

const router = Router();

/** GET /api/activity - the 50 most recent events, newest first. */
router.get('/', async (_req, res) => {
  const items = await Activity.find().sort({ createdAt: -1 }).limit(50);
  res.json(items);
});

/** DELETE /api/activity - clear the log. */
router.delete('/', async (_req, res) => {
  await Activity.deleteMany({});
  res.status(204).end();
});

export default router;
