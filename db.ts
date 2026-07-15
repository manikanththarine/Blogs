import mongoose from "mongoose";

const MONGODB_URI = "mongodb://Vercel-Admin-Blogspost:cEQizeVXVA8DG2rs@ac-toridw7-shard-00-00.msdramu.mongodb.net:27017,ac-toridw7-shard-00-01.msdramu.mongodb.net:27017,ac-toridw7-shard-00-02.msdramu.mongodb.net:27017/?ssl=true&replicaSet=atlas-huwl8v-shard-0&authSource=admin&appName=Blogspost";

// Cached across invocations so warm serverless instances (Vercel) reuse the
// same connection instead of opening a new one per request.
let connectionPromise: Promise<typeof mongoose> | null = null;

export function connectDB() {
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(MONGODB_URI)
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
