import { logger } from "../config/logger.js";
import { env } from "../config/env.js";

function toErrorMeta(error) {
  return {
    name: error?.name,
    message: error?.message,
    code: error?.code,
    stack: env.nodeEnv === "production" ? undefined : error?.stack,
  };
}

export function errorHandler(error, _req, res, _next) {
  logger.error("Request failed", toErrorMeta(error));

  if (error?.code === 11000) {
    return res.status(409).json({
      message: "Duplicate value already exists in the database.",
      code: "DUPLICATE_KEY",
    });
  }

  if (error?.name === "MongoServerSelectionError") {
    return res.status(503).json({
      message: "Database is currently unavailable.",
      code: "DB_UNAVAILABLE",
    });
  }

  if (error?.name === "MongoNetworkError") {
    return res.status(503).json({
      message: "Database network connectivity issue.",
      code: "DB_NETWORK_ERROR",
    });
  }

  return res.status(500).json({
    message: "Server error while processing request.",
    code: "INTERNAL_SERVER_ERROR",
    details: env.nodeEnv === "production" ? undefined : error?.message || "Unknown error",
  });
}
