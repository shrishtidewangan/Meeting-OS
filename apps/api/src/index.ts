// import { createApp } from "./app";
// import { getEnv } from "./config/env";

// const env = getEnv();
// const app = createApp();

// app.listen(env.API_PORT, () => {
//   console.log(`MeetingOS API starter listening on port ${env.API_PORT}`);
// });
import mongoose from "mongoose";
import { createApp } from "./app";
import { getEnv } from "./config/env";

const env = getEnv();

async function start() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const app = createApp();
  app.listen(env.API_PORT, () => {
    console.log(`MeetingOS API starter listening on port ${env.API_PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
