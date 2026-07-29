import { Router } from "express";
import { notImplementedHandler } from "../controllers/metrics.controller";

export const metricsRouter = Router();

metricsRouter.get("/analysis-runs", notImplementedHandler("get analysis run metrics"));

