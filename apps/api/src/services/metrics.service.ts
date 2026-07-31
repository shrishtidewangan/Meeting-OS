// export class MetricsService {
//   listAnalysisRuns() {
//     throw new Error("TODO: implement sanitized metrics in your branch");
//   }
// }

import { AnalysisRunRepository } from "../repositories/analysisRun.repository";

const analysisRunRepository = new AnalysisRunRepository();

export class MetricsService {
  async getAnalysisRunMetrics(ownerId: string) {
    const runs = await analysisRunRepository.findAllByOwner(ownerId);

    const byStatus: Record<string, number> = {};
    const byRequestedModel: Record<string, number> = {};
    let totalRetries = 0;
    let totalWarnings = 0;
    let durationSum = 0;
    let durationCount = 0;

    for (const run of runs) {
      byStatus[run.status] = (byStatus[run.status] ?? 0) + 1;
      byRequestedModel[run.requestedModel] = (byRequestedModel[run.requestedModel] ?? 0) + 1;
      totalWarnings += run.warnings?.length ?? 0;

      for (const agentRun of run.agentRuns ?? []) {
        totalRetries += agentRun.retryCount ?? 0;
      }

      if (run.completedAt) {
        durationSum += run.completedAt.getTime() - run.startedAt.getTime();
        durationCount += 1;
      }
    }

    // Sanitized recent-runs list — no transcript, prompts, or raw errors,
    // only public status/timing/model fields (per spec section 20/21).
    const recentRuns = runs.slice(0, 10).map((run) => ({
      analysisRunId: run._id,
      meetingId: run.meetingId,
      status: run.status,
      requestedModel: run.requestedModel,
      actualModel: run.actualModel,
      warningCount: run.warnings?.length ?? 0,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      durationMs: run.completedAt ? run.completedAt.getTime() - run.startedAt.getTime() : undefined,
    }));

    return {
      totalRuns: runs.length,
      byStatus,
      byRequestedModel,
      totalRetries,
      totalWarnings,
      averageDurationMs: durationCount > 0 ? Math.round(durationSum / durationCount) : null,
      recentRuns,
    };
  }
}