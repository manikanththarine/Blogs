import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/blogportal";

// Cached across invocations so warm serverless instances (Vercel) reuse the
// same connection instead of opening a new one per request.
let connectionPromise: Promise<typeof mongoose> | null = null;

export function connectDB() {
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(MONGO_URI)
      .then((conn) => {
        console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
        return conn;
      })
      .catch((error) => {
        connectionPromise = null;
        console.error(`MongoDB connection error: ${error.message}`);
        throw error;
      });
  }
  return connectionPromise;
}
