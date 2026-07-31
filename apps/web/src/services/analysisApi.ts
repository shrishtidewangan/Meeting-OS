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

// Before human review/resume, followUp and nextAgenda genuinely don't
// exist yet — this type reflects that instead of falsely promising they're
// always present (which the plain MeetingAnalysis contract type assumes).
type PartialMeetingAnalysis = Omit<MeetingAnalysis, "followUp" | "nextAgenda"> & {
  followUp?: MeetingAnalysis["followUp"];
  nextAgenda?: MeetingAnalysis["nextAgenda"];
};

export type AgentRunSummary = {
  nodeName: string;
  status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "FALLBACK";
  durationMs?: number;
  requestedModel?: string;
  actualModel?: string;
  retryCount: number;
};

export type AnalysisRun = {
  _id: string;
  ownerId: string;
  meetingId: string;
  threadId: string;
  status: AnalysisRunStatus;
  requestedModel: string;
  actualModel?: string;
  warnings: { code: string; message: string; nodeName?: string }[];
  agentRuns?: AgentRunSummary[];
  result?: PartialMeetingAnalysis;
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

export async function resumeAnalysis(
  meetingId: string,
  analysisRunId: string,
  reviewedRecord: {
    decisions: MeetingAnalysis["decisions"];
    actionItems: MeetingAnalysis["actionItems"];
    risksAndBlockers: MeetingAnalysis["risksAndBlockers"];
    openQuestions: MeetingAnalysis["openQuestions"];
  }
) {
  const res = await apiClient.post<{ ok: true; analysisRun: AnalysisRun }>(
    `/api/meetings/${meetingId}/analysis/${analysisRunId}/resume`,
    { reviewedRecord }
  );
  return res.analysisRun;
}