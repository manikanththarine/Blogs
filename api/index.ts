import "dotenv/config";
import type { IncomingMessage, ServerResponse } from "http";
import { connectDB } from "../db";
import { seedDatabase } from "../seed";
import { createApp } from "../app";

// Cached at module scope so a warm Vercel function instance reuses the same
// Express app and DB connection instead of rebuilding them on every request.
let appPromise: ReturnType<typeof createApp> | null = null;
let readyPromise: Promise<void> | null = null;

function getApp() {
  if (!appPromise) {
    appPromise = createApp();
  }
  return appPromise;
}

function getReady() {
  if (!readyPromise) {
    readyPromise = (async () => {
      await connectDB();
      await seedDatabase();
    })().catch((err) => {
      readyPromise = null;
      throw err;
    });
  }
  return readyPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await getReady();
    const app = await getApp();
    app(req, res);
  } catch (err) {
    console.error("Failed to initialize app:", err);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
}
