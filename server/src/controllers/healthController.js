import { env } from "../config/env.js";

export function createHealthController(db) {
  return {
    async getHealth(_req, res, next) {
      try {
        const startedAt = Date.now();
        await db.command({ ping: 1 });
        const pingMs = Date.now() - startedAt;

        res.json({
          ok: true,
          status: pingMs > 1000 ? "degraded" : "healthy",
          app: "KranalPrints API",
          database: db.databaseName,
          environment: env.nodeEnv,
          uptimeSeconds: Math.round(process.uptime()),
          dbPingMs: pingMs,
          memory: process.memoryUsage(),
          checkedAt: new Date().toISOString(),
        });
      } catch (error) {
        next(error);
      }
    },
  };
}
