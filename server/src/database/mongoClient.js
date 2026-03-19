import { MongoClient } from "mongodb";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

const client = new MongoClient(env.mongoUri, {
  maxPoolSize: 20,
  minPoolSize: 1,
  maxIdleTimeMS: 60000,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 30000,
  retryWrites: true,
});

let connectPromise = null;
let clientReady = false;
let heartbeatFailed = false;

client.on("serverHeartbeatFailed", (event) => {
  heartbeatFailed = true;
  logger.warn("Mongo heartbeat failed", {
    failure: event?.failure?.message || "unknown",
    connectionId: event?.connectionId,
  });
});

client.on("serverHeartbeatSucceeded", () => {
  if (heartbeatFailed) {
    heartbeatFailed = false;
    logger.info("Mongo heartbeat recovered");
  }
});

export async function connectToDatabase() {
  if (!connectPromise) {
    connectPromise = client.connect().then((connectedClient) => {
      clientReady = true;
      logger.info("Mongo connection established", { database: env.mongoDbName });
      return connectedClient;
    }).catch((error) => {
      connectPromise = null;
      clientReady = false;
      throw error;
    });
  }

  await connectPromise;
  return client.db(env.mongoDbName);
}

export async function getDatabase() {
  return connectToDatabase();
}

export async function closeDatabaseConnection() {
  if (connectPromise) {
    await client.close();
    connectPromise = null;
    clientReady = false;
    logger.info("Mongo connection closed");
  }
}
