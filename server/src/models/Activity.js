import mongoose from 'mongoose';
import { STATUSES } from '../constants.js';

// One row per notable event. The task title is copied in (a snapshot) so the
// log still reads correctly after the task is renamed or deleted.
const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['created', 'updated', 'moved', 'deleted'],
      required: true,
    },
    taskId: { type: mongoose.Schema.Types.ObjectId },
    taskTitle: { type: String, required: true },
    from: { type: String, enum: STATUSES },
    to: { type: String, enum: STATUSES },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activitySchema.index({ createdAt: -1 });

activitySchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

export const Activity = mongoose.model('Activity', activitySchema);
