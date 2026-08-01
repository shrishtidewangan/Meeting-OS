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
  AI_MODE: "mock" | "live";
  MOCK_AI_SCENARIO: string;
  OPENROUTER_API_KEY: string | undefined;
  OPENROUTER_MODEL: string;
  OPENROUTER_REASONING_MODEL: string | undefined;
  OPENROUTER_REASONING_EFFORT: string;
  OPENROUTER_BASE_URL: string;
  AI_REQUEST_TIMEOUT_MS: number;
  AI_MAX_RETRIES: number;
  PROMPT_VERSION: string;
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
    AI_MODE: (process.env.AI_MODE as "mock" | "live") ?? "mock",
    MOCK_AI_SCENARIO: process.env.MOCK_AI_SCENARIO ?? "success",
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENROUTER_MODEL: process.env.OPENROUTER_MODEL ?? "openrouter/free",
    OPENROUTER_REASONING_MODEL: process.env.OPENROUTER_REASONING_MODEL,
    OPENROUTER_REASONING_EFFORT: process.env.OPENROUTER_REASONING_EFFORT ?? "medium",
    OPENROUTER_BASE_URL: process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
    AI_REQUEST_TIMEOUT_MS: Number(process.env.AI_REQUEST_TIMEOUT_MS ?? 30000),
    AI_MAX_RETRIES: Number(process.env.AI_MAX_RETRIES ?? 1),
    PROMPT_VERSION: process.env.PROMPT_VERSION ?? "meetingos-v1",
  };
}
