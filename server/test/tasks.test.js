import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { Task } from '../src/models/Task.js';
import { Activity } from '../src/models/Activity.js';

let mongod;
const api = request(createApp());

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri('taskboard-test'));
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Task.deleteMany({});
  await Activity.deleteMany({});
});

const create = async (title, status = 'todo', extra = {}) =>
  (await api.post('/api/tasks').send({ title, status, ...extra }).expect(201)).body;

/** Titles of a column in order, as a client would see them. */
const column = async (status) =>
  (await api.get('/api/tasks').expect(200)).body.filter((t) => t.status === status).map((t) => t.title);

test('creates a task with defaults and appends to the bottom of its column', async () => {
  const a = await create('A');
  const b = await create('B');
  assert.equal(a.priority, 'medium');
  assert.equal(a.description, '');
  assert.equal(a.position, 0);
  assert.equal(b.position, 1);
  assert.ok(a.id && !a._id);
});

test('rejects a task without a title', async () => {
  const res = await api.post('/api/tasks').send({ title: '   ' }).expect(400);
  assert.equal(res.body.error, 'Validation failed');
  assert.equal(res.body.details[0].field, 'title');
});

test('rejects an invalid priority', async () => {
  await api.post('/api/tasks').send({ title: 'x', priority: 'urgent' }).expect(400);
});

test('edits a task and clears its due date', async () => {
  const t = await create('Old', 'todo', { dueDate: '2026-12-01' });
  assert.ok(t.dueDate);
  const res = await api.put(`/api/tasks/${t.id}`).send({ title: 'New', priority: 'high', dueDate: null }).expect(200);
  assert.equal(res.body.title, 'New');
  assert.equal(res.body.priority, 'high');
  assert.equal(res.body.dueDate, null);
});

test('returns 400 for a bad id and 404 for a missing task', async () => {
  await api.put('/api/tasks/not-an-id').send({ title: 'x' }).expect(400);
  await api.delete('/api/tasks/507f1f77bcf86cd799439011').expect(404);
});

test('moves a card to another column at a given index and closes the gap', async () => {
  const a = await create('A');
  await create('B');
  await create('C');
  const x = await create('X', 'done');
  await create('Y', 'done');

  await api.patch(`/api/tasks/${a.id}/move`).send({ status: 'done', index: 1 }).expect(200);

  assert.deepEqual(await column('todo'), ['B', 'C']);
  assert.deepEqual(await column('done'), ['X', 'A', 'Y']);

  // positions are contiguous in both columns
  const all = (await api.get('/api/tasks')).body;
  assert.deepEqual(all.filter((t) => t.status === 'todo').map((t) => t.position), [0, 1]);
  assert.deepEqual(all.filter((t) => t.status === 'done').map((t) => t.position), [0, 1, 2]);
  assert.ok(x.id);
});

test('reorders inside a column', async () => {
  const a = await create('A');
  await create('B');
  await create('C');
  await api.patch(`/api/tasks/${a.id}/move`).send({ status: 'todo', index: 2 }).expect(200);
  assert.deepEqual(await column('todo'), ['B', 'C', 'A']);
});

test('an index past the end appends; moving into an empty column works', async () => {
  const a = await create('A');
  await api.patch(`/api/tasks/${a.id}/move`).send({ status: 'in-progress', index: 99 }).expect(200);
  assert.deepEqual(await column('in-progress'), ['A']);
  assert.deepEqual(await column('todo'), []);
});

test('rejects an invalid move', async () => {
  const a = await create('A');
  await api.patch(`/api/tasks/${a.id}/move`).send({ status: 'archived', index: 0 }).expect(400);
  await api.patch(`/api/tasks/${a.id}/move`).send({ status: 'done', index: -1 }).expect(400);
});

test('delete removes the task and re-packs positions', async () => {
  const a = await create('A');
  await create('B');
  await api.delete(`/api/tasks/${a.id}`).expect(204);
  const [b] = (await api.get('/api/tasks')).body;
  assert.equal(b.title, 'B');
  assert.equal(b.position, 0);
});

test('activity log records create, move and delete (but not same-column reorders)', async () => {
  const a = await create('A');
  await create('B');
  await api.patch(`/api/tasks/${a.id}/move`).send({ status: 'todo', index: 1 }).expect(200); // reorder only
  await api.patch(`/api/tasks/${a.id}/move`).send({ status: 'done', index: 0 }).expect(200);
  await api.delete(`/api/tasks/${a.id}`).expect(204);

  const log = (await api.get('/api/activity').expect(200)).body;
  assert.deepEqual(log.map((e) => e.type).sort(), ['created', 'created', 'deleted', 'moved']);
  const moved = log.find((e) => e.type === 'moved');
  assert.equal(moved.from, 'todo');
  assert.equal(moved.to, 'done');
  assert.equal(moved.taskTitle, 'A');
});
