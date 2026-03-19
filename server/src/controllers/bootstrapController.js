import { getBootstrapPayload } from "../services/bootstrapService.js";

export function createBootstrapController(repositories) {
  return {
    async getBootstrap(_req, res, next) {
      try {
        res.json(await getBootstrapPayload(repositories));
      } catch (error) {
        next(error);
      }
    },
  };
}
