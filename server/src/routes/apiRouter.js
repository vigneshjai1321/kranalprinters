import { Router } from "express";

export function createApiRouter({ healthController, bootstrapController, jobController, customerController }) {
  const router = Router();

  router.get("/health", healthController.getHealth);
  router.get("/bootstrap", bootstrapController.getBootstrap);
  router.post("/jobs", jobController.createJob);
  router.put("/jobs/:id", jobController.updateJob);
  router.delete("/jobs/:id", jobController.deleteJob);
  router.post("/customers", customerController.createCustomer);

  return router;
}
