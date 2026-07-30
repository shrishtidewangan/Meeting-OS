// export type AppEnv = {
//   API_PORT: number;
//   NODE_ENV: string;
// };

// export function getEnv(): AppEnv {
//   return {
//     API_PORT: Number(process.env.API_PORT ?? 3001),
//     NODE_ENV: process.env.NODE_ENV ?? "development"
//   };
// }

import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

export type AppEnv = {
  API_PORT: number;
  NODE_ENV: string;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_ISSUER: string;
};

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getEnv(): AppEnv {
  return {
    API_PORT: Number(process.env.API_PORT ?? 3001),
    NODE_ENV: process.env.NODE_ENV ?? "development",
    MONGODB_URI: required("MONGODB_URI"),
    JWT_SECRET: required("JWT_SECRET"),
    JWT_ISSUER: required("JWT_ISSUER"),
  };
}

