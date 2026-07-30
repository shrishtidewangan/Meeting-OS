// import { Router } from "express";
// import { notImplementedHandler } from "../controllers/analysis.controller";

// export const analysisRouter = Router();

// analysisRouter.get("/:analysisRunId", notImplementedHandler("get analysis run"));

import { Router } from "express";
import { analysisController } from "../controllers/analysis.controller";
import { requireAuth } from "../middleware/auth.middleware";

export const analysisRouter = Router();

analysisRouter.use(requireAuth);

analysisRouter.get("/:analysisRunId", analysisController.getOne);