import "dotenv/config";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: requireEnv("MONGODB_URI"),
  mongoDbName: process.env.MONGODB_DB_NAME || "kranalprints",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
};
