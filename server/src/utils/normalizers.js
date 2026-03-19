export function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  return [value];
}

export function normalizeJob(job) {
  if (!job || typeof job !== "object") return job;

  return {
    ...job,
    printing_type: toArray(job.printing_type),
    special_instructions: toArray(job.special_instructions),
    finishing_main: toArray(job.finishing_main),
    uv_finish: toArray(job.uv_finish),
    conversion_finish: toArray(job.conversion_finish),
    processes: toArray(job.processes),
    colours: toArray(job.colours),
    history: toArray(job.history),
    upload_design: Array.isArray(job.upload_design) ? job.upload_design : [],
    layout_json:
      job.layout_json && typeof job.layout_json === "object"
        ? job.layout_json
        : null,
  };
}

export function normalizeCustomerPayload(customer) {
  return {
    name: String(customer?.name || customer?.customerName || "").trim(),
    location: String(customer?.location || customer?.customerLocation || "").trim(),
  };
}
