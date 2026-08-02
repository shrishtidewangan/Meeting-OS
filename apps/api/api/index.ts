import mongoose from "mongoose";
import { createApp } from "../src/app";
import { getEnv } from "../src/config/env";

const env = getEnv();
const app = createApp();

// Serverless functions can be reused across nearby invocations ("warm"),
// so we cache the connection instead of reconnecting on every request —
// reconnecting every time would be slow and could exhaust MongoDB's
// connection limit under real traffic.
let isConnected = false;

async function ensureDbConnected() {
  if (isConnected) return;
  await mongoose.connect(env.MONGODB_URI);
  isConnected = true;
}

export default async function handler(req: any, res: any) {
  await ensureDbConnected();
  return app(req, res);
}