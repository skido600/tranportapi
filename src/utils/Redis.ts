import { createClient } from "redis";

const client = createClient({
  url: "redis://localhost:6379",
});
client.on("error", (err) => console.error("Redis Client Error", err));
async function connectRedis() {
  try {
    await client.connect();
    console.log("✅ Redis connected successfully!");
  } catch (error) {
    console.error("❌ Failed to connect to Redis:", error);
  }
  //   } finally {
  //     await client.quit();
  //   }
}
connectRedis();
export default client;
