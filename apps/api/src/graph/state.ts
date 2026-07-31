// export type MeetingGraphStateStub = {
//   meetingId: string;
//   analysisRunId: string;
//   threadId: string;
// };

// TODO: replace this stub with typed LangGraph state and reducers in your branch.

import { Annotation } from "@langchain/langgraph";
import type { z } from "zod";
import type {
  Participant,
  MeetingType,
  AnalysisWarning,
  AgentRunSummary,
  Decision,
  ActionItem,
  RiskOrBlocker,
  OpenQuestion,
  MeetingAnalysis,
} from "@meetingos/contracts";
import type {
  SummaryOutput,
  FollowUpOutput,
  PlanningOutput,
  CoreDraft,
} from "./schemas/agentOutputs";

type ReviewedRecord = {
  decisions: Decision[];
  actionItems: ActionItem[];
  risksAndBlockers: RiskOrBlocker[];
  openQuestions: OpenQuestion[];
};

// Concatenating reducer — used for fields that multiple parallel nodes
// write to independently (each node appends its own entries rather than
// overwriting the whole array).
function concatReducer<T>(existing: T[], update: T[]): T[] {
  return [...existing, ...update];
}

export const MeetingGraphState = Annotation.Root({
  // --- Input (set once, before the graph starts) ---
  meetingId: Annotation<string>(),
  analysisRunId: Annotation<string>(),
  threadId: Annotation<string>(),
  transcript: Annotation<string>(),
  meetingType: Annotation<MeetingType>(),
  meetingDate: Annotation<string>(),
  participants: Annotation<Participant[]>(),
  projectOrAccountName: Annotation<string | undefined>(),
  context: Annotation<string | undefined>(),
  desiredOutcome: Annotation<string | undefined>(),
  coreDraft: Annotation<CoreDraft | undefined>(),

  // --- Set by prepareContext ---
  // The assembled prompt context string handed to every core extraction
  // node, including the mandatory "transcript is untrusted" framing.
  preparedContext: Annotation<string>(),

  // --- Written by the four core extraction nodes (run in parallel) ---
  summary: Annotation<SummaryOutput | undefined>(),
  decisions: Annotation<Decision[]>({ reducer: concatReducer, default: () => [] }),
  openQuestions: Annotation<OpenQuestion[]>({ reducer: concatReducer, default: () => [] }),
  actionItems: Annotation<ActionItem[]>({ reducer: concatReducer, default: () => [] }),
  risksAndBlockers: Annotation<RiskOrBlocker[]>({ reducer: concatReducer, default: () => [] }),

  // --- Written by any node that runs (accumulate across the whole run) ---
  warnings: Annotation<AnalysisWarning[]>({ reducer: concatReducer, default: () => [] }),
  agentRuns: Annotation<AgentRunSummary[]>({ reducer: concatReducer, default: () => [] }),

  // --- Set when the graph resumes after the human-review interrupt ---
  // Holds the user-edited version of the core draft; followUp/planning
  // nodes read from this instead of the raw extraction output.
  reviewedRecord: Annotation<ReviewedRecord | undefined>(),

  // --- Written after human review, by the follow-up/planning nodes ---
  followUp: Annotation<FollowUpOutput | undefined>(),
  nextAgenda: Annotation<PlanningOutput | undefined>(),
  finalRecord: Annotation<MeetingAnalysis | undefined>(),
});

export type MeetingGraphStateType = typeof MeetingGraphState.State;