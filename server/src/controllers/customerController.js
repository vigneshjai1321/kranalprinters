import { normalizeCustomerPayload } from "../utils/normalizers.js";
import { validateCustomerPayload } from "../utils/validators.js";

export function createCustomerController({ customerRepository }) {
  function normalizeLocation(location) {
    return String(location || "").replace(/\s+/g, " ").trim();
  }

  return {
    async createCustomer(req, res, next) {
      try {
        const customer = normalizeCustomerPayload(req.body);
        customer.location = normalizeLocation(customer.location);

        const validationError = validateCustomerPayload(customer);
        if (validationError) {
          return res.status(400).json({ ok: false, reason: "missing", message: validationError });
        }

        if (customer.name.length > 120) {
          return res.status(400).json({
            ok: false,
            reason: "invalid",
            message: "Customer name is too long (max 120 characters).",
          });
        }

        if (customer.location.length > 160) {
          return res.status(400).json({
            ok: false,
            reason: "invalid",
            message: "Customer location is too long (max 160 characters).",
          });
        }

        const existing = await customerRepository.findByNameCaseInsensitive(customer.name);
        if (existing) {
          return res.json({ ok: false, reason: "exists", name: existing.name, location: existing.location });
        }

        const created = await customerRepository.insertOne(customer);
        return res.status(201).json({ ok: true, name: created.name, location: created.location });
      } catch (error) {
        return next(error);
      }
    },
  };
}
