// import { Router } from "express";
// import { notImplementedHandler } from "../controllers/metrics.controller";

// export const metricsRouter = Router();

// metricsRouter.get("/analysis-runs", notImplementedHandler("get analysis run metrics"));

import { Router } from "express";
import { metricsController } from "../controllers/metrics.controller";
import { requireAuth } from "../middleware/auth.middleware";

export const metricsRouter = Router();

metricsRouter.use(requireAuth);

metricsRouter.get("/analysis-runs", metricsController.getAnalysisRunMetrics);