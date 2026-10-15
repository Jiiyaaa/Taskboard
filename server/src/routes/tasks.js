import { Router } from 'express';
import { Task } from '../models/Task.js';
import { Activity } from '../models/Activity.js';
import { createTaskSchema, updateTaskSchema, moveTaskSchema } from '../validation.js';
import { HttpError, parse, assertValidId } from '../errors.js';

const router = Router();

/** GET /api/tasks - every task, ordered column by column. */
router.get('/', async (_req, res) => {
  const tasks = await Task.find().sort({ status: 1, position: 1 });
  res.json(tasks);
});

/** POST /api/tasks - create a task at the bottom of its column. */
router.post('/', async (req, res) => {
  const data = parse(createTaskSchema, req.body);

  const last = await Task.findOne({ status: data.status }).sort({ position: -1 });
  const task = await Task.create({ ...data, position: last ? last.position + 1 : 0 });

  await Activity.create({ type: 'created', taskId: task._id, taskTitle: task.title, to: task.status });
  res.status(201).json(task);
});

/** PUT /api/tasks/:id - edit title, description, priority or due date. */
router.put('/:id', async (req, res) => {
  assertValidId(req.params.id);
  const changes = parse(updateTaskSchema, req.body);

  const task = await Task.findByIdAndUpdate(req.params.id, changes, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!task) throw new HttpError(404, 'Task not found');

  await Activity.create({ type: 'updated', taskId: task._id, taskTitle: task.title });
  res.json(task);
});

/** DELETE /api/tasks/:id - remove a task and close the gap it leaves. */
router.delete('/:id', async (req, res) => {
  assertValidId(req.params.id);

  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) throw new HttpError(404, 'Task not found');

  await reindexColumn(task.status);
  await Activity.create({ type: 'deleted', taskId: task._id, taskTitle: task.title, from: task.status });
  res.status(204).end();
});

/**
 * PATCH /api/tasks/:id/move  { status, index }
 *
 * Puts the task at `index` inside column `status` (which may be a different
 * column from the one it is in now) and rewrites positions so every column
 * stays 0,1,2,... Handles both "change column" and "reorder within column".
 */
router.patch('/:id/move', async (req, res) => {
  assertValidId(req.params.id);
  const { status, index } = parse(moveTaskSchema, req.body);

  const task = await Task.findById(req.params.id);
  if (!task) throw new HttpError(404, 'Task not found');

  const from = task.status;

  // Target column without the moved task, then insert it at the requested slot.
  const targetIds = (await Task.find({ status, _id: { $ne: task._id } })
    .sort({ position: 1 })
    .select('_id'))
    .map((t) => t._id);
  targetIds.splice(Math.min(index, targetIds.length), 0, task._id);

  const writes = targetIds.map((_id, position) => ({
    updateOne: {
      filter: { _id },
      update: { $set: _id.equals(task._id) ? { position, status } : { position } },
    },
  }));

  // If it left a column, close the gap in the column it left.
  if (from !== status) {
    const sourceIds = (await Task.find({ status: from, _id: { $ne: task._id } })
      .sort({ position: 1 })
      .select('_id'))
      .map((t) => t._id);
    sourceIds.forEach((_id, position) =>
      writes.push({ updateOne: { filter: { _id }, update: { $set: { position } } } })
    );
  }

  // One bulk call keeps the window for a half-applied move as small as possible.
  await Task.bulkWrite(writes);

  if (from !== status) {
    await Activity.create({ type: 'moved', taskId: task._id, taskTitle: task.title, from, to: status });
  }

  res.json(await Task.findById(task._id));
});

async function reindexColumn(status) {
  const ids = (await Task.find({ status }).sort({ position: 1 }).select('_id')).map((t) => t._id);
  if (!ids.length) return;
  await Task.bulkWrite(
    ids.map((_id, position) => ({ updateOne: { filter: { _id }, update: { $set: { position } } } }))
  );
}

export default router;
