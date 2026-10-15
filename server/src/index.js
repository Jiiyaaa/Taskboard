import 'dotenv/config';
import { createApp } from './app.js';
import { connectDb, disconnectDb } from './db.js';

const port = process.env.PORT || 4000;

await connectDb();
const server = createApp().listen(port, () => console.log(`[api] listening on :${port}`));

// Close cleanly on Ctrl+C / host restarts so the dev database is not corrupted.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
  });
}
