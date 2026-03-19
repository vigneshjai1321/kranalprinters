export function isPositiveNumber(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

export function validateJobPayload(job) {
  if (!job || typeof job !== "object") {
    return "Job payload is required.";
  }

  if (!isPositiveNumber(job.id)) {
    return "Job id must be a positive number.";
  }

  if (!String(job.job_no || "").trim()) {
    return "Job number is required.";
  }

  if (!String(job.customer_name || "").trim()) {
    return "Customer name is required.";
  }

  if (!String(job.job_name || "").trim()) {
    return "Job name is required.";
  }

  return null;
}

export function validateCustomerPayload(customer) {
  if (!String(customer?.name || "").trim()) {
    return "Customer name is required.";
  }

  if (!String(customer?.location || "").trim()) {
    return "Customer location is required.";
  }

  return null;
}
