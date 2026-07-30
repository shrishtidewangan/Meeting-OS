// import type { RequestHandler } from "express";
// import { createNotImplementedHandler } from "./notImplemented";

// export function notImplementedHandler(feature: string): RequestHandler {
//   return createNotImplementedHandler(`Analysis TODO: ${feature}`);
// }
import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { AnalysisService } from "../services/analysis.service";

const analysisService = new AnalysisService();

function handleError(err: unknown, res: Response) {
  if (err instanceof Error) {
    const isNotFound =
      err.message === "Meeting not found" || err.message === "Analysis run not found";
    if (isNotFound) {
      return res.status(404).json({
        ok: false,
        error: { code: "ANALYSIS_NOT_FOUND", message: err.message },
      });
    }
    if (err.message.startsWith("Forbidden")) {
      return res.status(403).json({
        ok: false,
        error: { code: "ANALYSIS_FORBIDDEN", message: err.message },
      });
    }
    return res.status(400).json({
      ok: false,
      error: { code: "ANALYSIS_REQUEST_INVALID", message: err.message },
    });
  }
  return res.status(500).json({
    ok: false,
    error: { code: "INTERNAL_ERROR", message: "Unexpected error" },
  });
}

export const analysisController = {
  // POST /api/meetings/:meetingId/analysis
  // Body: { scenario?: "success" | "partial-failure" | "timeout" | "malformed-output" }
  async start(req: AuthenticatedRequest, res: Response) {
    try {
      const run = await analysisService.startAnalysis(
        req.userId!,
        req.params.meetingId,
        req.body?.scenario
      );
      res.status(201).json({ ok: true, analysisRun: run });
    } catch (err) {
      handleError(err, res);
    }
  },

  // GET /api/meetings/:meetingId/analysis/:analysisRunId
  async getForMeeting(req: AuthenticatedRequest, res: Response) {
    try {
      const run = await analysisService.getAnalysisRunForMeeting(
        req.userId!,
        req.params.meetingId,
        req.params.analysisRunId
      );
      res.status(200).json({ ok: true, analysisRun: run });
    } catch (err) {
      handleError(err, res);
    }
  },

  // GET /api/analysis/:analysisRunId  (top-level lookup, no meetingId needed)
  async getOne(req: AuthenticatedRequest, res: Response) {
    try {
      const run = await analysisService.getAnalysisRun(req.userId!, req.params.analysisRunId);
      res.status(200).json({ ok: true, analysisRun: run });
    } catch (err) {
      handleError(err, res);
    }
  },
};
