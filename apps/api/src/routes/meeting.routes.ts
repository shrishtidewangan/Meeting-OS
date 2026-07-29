import { Router } from "express";
import { notImplementedHandler } from "../controllers/meeting.controller";

export const meetingRouter = Router();

meetingRouter.post("/", notImplementedHandler("create meeting"));
meetingRouter.get("/", notImplementedHandler("list owned meetings"));
meetingRouter.get("/:meetingId", notImplementedHandler("get owned meeting"));
meetingRouter.patch("/:meetingId", notImplementedHandler("update owned meeting"));
meetingRouter.delete("/:meetingId", notImplementedHandler("delete owned meeting"));
meetingRouter.post("/:meetingId/transcript", notImplementedHandler("save transcript"));
meetingRouter.post("/:meetingId/analysis", notImplementedHandler("start analysis"));
meetingRouter.get("/:meetingId/analysis/:analysisRunId", notImplementedHandler("get analysis status"));
meetingRouter.post("/:meetingId/analysis/:analysisRunId/resume", notImplementedHandler("resume analysis"));
meetingRouter.post("/:meetingId/analysis/:analysisRunId/retry", notImplementedHandler("retry analysis"));

