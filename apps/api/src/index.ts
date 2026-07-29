import { createApp } from "./app";
import { getEnv } from "./config/env";

const env = getEnv();
const app = createApp();

app.listen(env.API_PORT, () => {
  console.log(`MeetingOS API starter listening on port ${env.API_PORT}`);
});

