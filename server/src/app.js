import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { createHealthController } from "./controllers/healthController.js";
import { createBootstrapController } from "./controllers/bootstrapController.js";
import { createJobController } from "./controllers/jobController.js";
import { createCustomerController } from "./controllers/customerController.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { createJobRepository } from "./repositories/jobRepository.js";
import { createCustomerRepository } from "./repositories/customerRepository.js";
import { createApiRouter } from "./routes/apiRouter.js";

export function createApp(db) {
  const app = express();
  const repositories = {
    jobRepository: createJobRepository(db),
    customerRepository: createCustomerRepository(db),
  };

  const controllers = {
    healthController: createHealthController(db),
    bootstrapController: createBootstrapController(repositories),
    jobController: createJobController(repositories),
    customerController: createCustomerController(repositories),
  };

  app.use(cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (origin === env.clientOrigin) return callback(null, true);
      if (origin.startsWith("http://localhost:")) return callback(null, true);
      if (origin.endsWith(".vercel.app")) return callback(null, true);
      return callback(new Error("CORS origin not allowed: " + origin));
    },
    credentials: false,
  }));
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use("/api", createApiRouter(controllers));
  app.use(errorHandler);

  return { app, repositories };
}
