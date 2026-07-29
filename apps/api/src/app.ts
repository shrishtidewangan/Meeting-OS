import express from "express";
import { analysisRouter } from "./routes/analysis.routes";
import { authRouter } from "./routes/auth.routes";
import { healthRouter } from "./routes/health.routes";
import { meetingRouter } from "./routes/meeting.routes";
import { metricsRouter } from "./routes/metrics.routes";
import { errorMiddleware } from "./middleware/error.middleware";

export function createApp() {
  const app = express();

  app.use(express.json({ limit: "1mb" }));

  app.use("/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/meetings", meetingRouter);
  app.use("/api/metrics", metricsRouter);
  app.use("/api/analysis", analysisRouter);

  app.use(errorMiddleware);

  return app;
}

