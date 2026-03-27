import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 10000,
});

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  return [value];
}

function toOptionalNumber(value) {
  if (value === undefined || value === null || value === "") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}

function normalizeJob(job) {
  if (!job || typeof job !== "object") return job;

  return {
    ...job,
    quantity: toOptionalNumber(job.quantity),
    size_l: toOptionalNumber(job.size_l),
    size_b: toOptionalNumber(job.size_b),
    size_h: toOptionalNumber(job.size_h),
    border_waste_mm: toOptionalNumber(job.border_waste_mm),
    color_count: toOptionalNumber(job.color_count),
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

export const api = {
  async bootstrap() {
    const { data } = await client.get("/bootstrap");

    return {
      jobs: Array.isArray(data.jobs) ? data.jobs.map(normalizeJob) : [],
      customers: Array.isArray(data.customers) ? data.customers : [],
      customerLocations: data.customerLocations || {},
    };
  },

  async createJob(job) {
    const { data } = await client.post("/jobs", normalizeJob(job));
    return normalizeJob(data);
  },

  async updateJob(job) {
    const { data } = await client.put(`/jobs/${job.id}`, normalizeJob(job));
    return normalizeJob(data);
  },

  async deleteJob(jobId) {
    await client.delete(`/jobs/${jobId}`);
  },

  async addCustomer(payload) {
    const { data } = await client.post("/customers", payload);
    return data;
  },

  client,
};
