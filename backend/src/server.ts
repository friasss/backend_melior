import { createServer } from "http";
import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/database";
import { initializeSocket } from "./sockets";

const httpServer = createServer(app);

// Initialize Socket.io
initializeSocket(httpServer);

async function main() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log("✅ Database connected");

    httpServer.listen(env.PORT, () => {
      console.log(`
  ╔═══════════════════════════════════════════╗
  ║   🏠 Melior Real Estate API               ║
  ║   Running on port ${String(env.PORT).padEnd(25)}║
  ║   Environment: ${env.NODE_ENV.padEnd(25)}║
  ║   Client URL: ${env.CLIENT_URL.padEnd(26)}║
  ╚═══════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  httpServer.close(() => process.exit(0));
});

main();
