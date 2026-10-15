import mongoose from 'mongoose';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let memoryServer = null;

/**
 * Connects to MongoDB.
 *  - With MONGODB_URI set (Atlas, Docker, local mongod) it connects there.
 *  - Without it, outside production, it starts a throwaway local MongoDB that
 *    stores its files in server/.data, so `npm run dev` works with zero setup
 *    and data survives restarts.
 */
export async function connectDb() {
  let uri = process.env.MONGODB_URI;

  if (!uri) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MONGODB_URI is required in production');
    }
    // Imported lazily so production never needs this dev-only dependency.
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const dbPath = path.resolve(__dirname, '../.data');
    fs.mkdirSync(dbPath, { recursive: true });
    memoryServer = await MongoMemoryServer.create({
      instance: { dbPath, storageEngine: 'wiredTiger' },
      // Fixed cache folder, so the binary is downloaded once however the server is started.
      binary: { downloadDir: path.resolve(__dirname, '../node_modules/.cache/mongodb-memory-server') },
    });
    uri = memoryServer.getUri('taskboard');
    console.log('[db] MONGODB_URI not set - using local dev database in server/.data');
  }

  await mongoose.connect(uri);
  console.log('[db] connected');
}

export async function disconnectDb() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop({ doCleanup: false });
}
