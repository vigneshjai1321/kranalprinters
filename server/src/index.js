import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { createApp } from "./app.js";
import { closeDatabaseConnection, connectToDatabase } from "./database/mongoClient.js";

let server;

async function startServer() {
  const db = await connectToDatabase();
  const { app, repositories } = createApp(db);

  await Promise.all([
    repositories.jobRepository.ensureIndexes(),
    repositories.customerRepository.ensureIndexes(),
  ]);

  server = app.listen(env.port, () => {
    logger.info(`KranalPrints API running on http://localhost:${env.port}`);
  });
}

async function shutdown(signal) {
  logger.info(`Received ${signal}. Closing server...`);

  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  await closeDatabaseConnection();
  process.exit(0);
}

startServer().catch((error) => {
  logger.error("Failed to start server", error);
  process.exit(1);
});

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
