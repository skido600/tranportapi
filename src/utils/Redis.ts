import { createClient } from "redis";
import { config } from "dotenv";
config();

const client = createClient({
  // url: "redis://localhost:6379",
  url: process.env.REDIS_URL as string,
});
//  (process.env.REDIS_URL as string) ||
client.on("error", (err) => {
  throw err;
});

async function connectRedis() {
  try {
    await client.connect();
    console.log("✅ Redis connected successfully!");
  } catch (error) {
    console.error("❌ Failed to connect to Redis:", error);
    process.exit(1);
  }
}

// Immediately connect on import
connectRedis();

export default client;
