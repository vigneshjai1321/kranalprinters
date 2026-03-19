import { createApp } from "../server/src/app.js";
import { getDatabase } from "../server/src/database/mongoClient.js";

let handler;

export default async function vercelHandler(req, res) {
  if (!handler) {
    const db = await getDatabase();
    const { app } = createApp(db);
    handler = app;
  }

  return handler(req, res);
}
