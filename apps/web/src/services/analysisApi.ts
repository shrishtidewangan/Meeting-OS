// export async function startAnalysis() {
//   throw new Error("TODO: implement startAnalysis in your branch");
// }

// export async function getAnalysisStatus() {
//   throw new Error("TODO: implement getAnalysisStatus in your branch");
// }

// export async function resumeAnalysis() {
//   throw new Error("TODO: implement resumeAnalysis in your branch");
// }

import { apiClient } from "./apiClient";
import type { MeetingAnalysis } from "@meetingos/contracts";

export type AnalysisRunStatus =
  | "QUEUED"
  | "RUNNING"
  | "NEEDS_REVIEW"
  | "PARTIAL_FAILURE"
  | "FINALIZED"
  | "FAILED";

export type AnalysisRun = {
  _id: string;
  ownerId: string;
  meetingId: string;
  threadId: string;
  status: AnalysisRunStatus;
  requestedModel: string;
  actualModel?: string;
  warnings: { code: string; message: string; nodeName?: string }[];
  result?: MeetingAnalysis;
  startedAt: string;
  completedAt?: string;
};

export type MockScenario = "success" | "partial-failure" | "timeout" | "malformed-output";

export async function startAnalysis(meetingId: string, scenario?: MockScenario) {
  const res = await apiClient.post<{ ok: true; analysisRun: AnalysisRun }>(
    `/api/meetings/${meetingId}/analysis`,
    scenario ? { scenario } : {}
  );
  return res.analysisRun;
}

export async function getAnalysisStatus(meetingId: string, analysisRunId: string) {
  const res = await apiClient.get<{ ok: true; analysisRun: AnalysisRun }>(
    `/api/meetings/${meetingId}/analysis/${analysisRunId}`
  );
  return res.analysisRun;
}

// Not implemented on the backend yet — this is the LangGraph human-review
// resume mechanism (spec section 12), which is Day 2-3 scope.
export async function resumeAnalysis() {
  throw new Error("Resume is not implemented yet — this requires the LangGraph interrupt/resume mechanism (a later step).");
}