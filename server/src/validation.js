import { z } from 'zod';
import { STATUSES, PRIORITIES } from './constants.js';

const title = z
  .string({ error: 'Title is required' })
  .trim()
  .min(1, 'Title is required')
  .max(120, 'Title must be 120 characters or fewer');

const description = z.string().trim().max(1000, 'Description must be 1000 characters or fewer');

// Accepts "2026-10-20" or a full ISO string; null clears the date.
const dueDate = z
  .union([z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid due date'), z.null()])
  .transform((v) => (v ? new Date(v) : null));

export const createTaskSchema = z.object({
  title,
  description: description.default(''),
  priority: z.enum(PRIORITIES).default('medium'),
  status: z.enum(STATUSES).default('todo'),
  dueDate: dueDate.optional(),
});

// Status/position change only through the dedicated move endpoint.
export const updateTaskSchema = z
  .object({
    title: title.optional(),
    description: description.optional(),
    priority: z.enum(PRIORITIES).optional(),
    dueDate: dueDate.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field to update');

export const moveTaskSchema = z.object({
  status: z.enum(STATUSES),
  index: z.number().int().min(0),
});
