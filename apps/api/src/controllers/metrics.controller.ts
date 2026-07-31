// import type { RequestHandler } from "express";
// import { createNotImplementedHandler } from "./notImplemented";

// export function notImplementedHandler(feature: string): RequestHandler {
//   return createNotImplementedHandler(`Metrics TODO: ${feature}`);
// }

import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { MetricsService } from "../services/metrics.service";

const metricsService = new MetricsService();

export const metricsController = {
  async getAnalysisRunMetrics(req: AuthenticatedRequest, res: Response) {
    try {
      const metrics = await metricsService.getAnalysisRunMetrics(req.userId!);
      res.status(200).json({ ok: true, metrics });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: { code: "INTERNAL_ERROR", message: err instanceof Error ? err.message : "Unexpected error" },
      });
    }
  },
};