import mongoose from 'mongoose';
import { STATUSES, PRIORITIES } from '../constants.js';

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    status: { type: String, enum: STATUSES, default: 'todo' },
    // 0-based order of the card inside its column. The server keeps each
    // column's positions contiguous (0,1,2,...) after every move.
    position: { type: Number, required: true, default: 0 },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true }
);

// Every board load reads tasks grouped by column and ordered by position.
taskSchema.index({ status: 1, position: 1 });

// Present `id` instead of `_id` / `__v` to API clients.
taskSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

export const Task = mongoose.model('Task', taskSchema);
