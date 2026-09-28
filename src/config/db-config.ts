import * as dotenv from "dotenv";

dotenv.config();
async function getDbConfig() {
  try {
    return {
      HOST: process.env.DB_HOST,
      USER: process.env.DB_USER,
      PASSWORD: process.env.DB_PASSWORD,
      DB: process.env.DB_SCHEMA,
      pool: {
        max: 200,
        min: 0,
        acquire: 60000,
        idle: 10000,
      },
    };
  } catch (error) {
    console.error(`getDbConfig : ${error || "DB configuration error"}`);
    throw error; // Rethrow the error to be handled by the caller
  }
}

// Export dialect
export const dialect = "mysql";

// Export the configuration as a promise
export const configPromise = getDbConfig();
