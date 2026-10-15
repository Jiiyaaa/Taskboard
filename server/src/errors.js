import mongoose from 'mongoose';
import { ZodError } from 'zod';

/** An error we throw on purpose, with the HTTP status to send back. */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Parse request data with a zod schema; a failure becomes a 400 (see errorHandler). */
export const parse = (schema, data) => schema.parse(data);

/** Reject malformed ids with a 400 before they ever reach a query. */
export function assertValidId(id) {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, 'Invalid task id');
}

export function notFound(_req, res) {
  res.status(404).json({ error: 'Route not found' });
}

// Express 5 forwards errors from async handlers here automatically.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.issues.map((i) => ({
        field: i.path.join('.') || null,
        message: i.message,
      })),
    });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  // Malformed JSON body from express.json()
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body is not valid JSON' });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
}
