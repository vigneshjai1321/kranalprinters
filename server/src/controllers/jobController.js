import { normalizeJob } from "../utils/normalizers.js";
import { validateJobPayload } from "../utils/validators.js";

export function createJobController({ jobRepository }) {
  return {
    async createJob(req, res, next) {
      try {
        const job = normalizeJob(req.body);
        const validationError = validateJobPayload(job);
        if (validationError) {
          return res.status(400).json({ message: validationError });
        }

        const created = await jobRepository.insertOne(job);
        return res.status(201).json(created);
      } catch (error) {
        return next(error);
      }
    },

    async updateJob(req, res, next) {
      try {
        const id = Number(req.params.id);
        const job = normalizeJob(req.body);
        const validationError = validateJobPayload(job);
        if (validationError) {
          return res.status(400).json({ message: validationError });
        }

        if (id !== Number(job.id)) {
          return res.status(400).json({ message: "Route id and job id must match." });
        }

        const updated = await jobRepository.updateById(id, job);
        if (!updated) {
          return res.status(404).json({ message: "Job not found" });
        }

        return res.json(job);
      } catch (error) {
        return next(error);
      }
    },

    async deleteJob(req, res, next) {
      try {
        const id = Number(req.params.id);
        const deleted = await jobRepository.deleteById(id);
        if (!deleted) {
          return res.status(404).json({ message: "Job not found" });
        }

        return res.status(204).send();
      } catch (error) {
        return next(error);
      }
    },
  };
}
