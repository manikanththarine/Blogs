import "dotenv/config";
import { connectDB } from "./db";
import { seedDatabase } from "./seed";
import { createApp } from "./app";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

async function startServer() {
  await connectDB();
  await seedDatabase();
  const app = await createApp();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
