import { createApp } from "../server/src/app.js";
import { getDatabase } from "../server/src/database/mongoClient.js";

// Initialize the database connection eagerly when this module is loaded
const initPromise = getDatabase().then(db => createApp(db).app).catch(err => {
  console.error("Failed to initialize database:", err);
  throw err;
});

let handler;

export default async function vercelHandler(req, res) {
  if (!handler) {
    handler = await initPromise;
  }

  return handler(req, res);
}
