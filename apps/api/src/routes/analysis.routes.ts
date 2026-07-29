import { Router } from "express";
import { notImplementedHandler } from "../controllers/analysis.controller";

export const analysisRouter = Router();

analysisRouter.get("/:analysisRunId", notImplementedHandler("get analysis run"));

