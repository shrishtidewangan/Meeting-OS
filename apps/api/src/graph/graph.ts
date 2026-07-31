// export function createMeetingGraph() {
//   throw new Error("TODO: implement LangGraph StateGraph, edges, interrupt, and resume in your branch");
// }

import { StateGraph, START, END, interrupt } from "@langchain/langgraph";
import { meetingInputSchema, coreDraftSchema } from "@meetingos/validation";
import { MeetingGraphState, type MeetingGraphStateType } from "./state";
import { createSummaryNode } from "./nodes/summary.node";
import { createDecisionNode } from "./nodes/decision.node";
import { createActionNode } from "./nodes/action.node";
import { createRiskNode } from "./nodes/risk.node";
import { createFollowUpNode } from "./nodes/followUp.node";
import { createPlanningNode } from "./nodes/planning.node";
import type { MeetingModelClient } from "../model-client/MeetingModelClient";
import { createCheckpointer } from "./checkpointer";
import { meetingAnalysisSchema } from "@meetingos/validation";

// Reuses the canonical meetingInputSchema (minus "title", which no agent
// node needs). Genuine defense-in-depth: the API layer already validates
// before invoking the graph, but the graph shouldn't silently trust that.
const graphInputSchema = meetingInputSchema.pick({
  transcript: true,
  meetingType: true,
  meetingDate: true,
  participants: true,
  projectOrAccountName: true,
  context: true,
  desiredOutcome: true,
});

function validateInputNode(state: MeetingGraphStateType) {
  const result = graphInputSchema.safeParse({
    transcript: state.transcript,
    meetingType: state.meetingType,
    meetingDate: state.meetingDate,
    participants: state.participants,
    projectOrAccountName: state.projectOrAccountName,
    context: state.context,
    desiredOutcome: state.desiredOutcome,
  });

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    throw new Error(firstIssue?.message ?? "Invalid input for analysis");
  }

  return {};
}

function prepareContextNode(state: MeetingGraphStateType) {
  const parts = [
    `Meeting type: ${state.meetingType}`,
    state.projectOrAccountName ? `Project/account: ${state.projectOrAccountName}` : null,
    state.context ? `Context: ${state.context}` : null,
    state.desiredOutcome ? `Desired outcome: ${state.desiredOutcome}` : null,
    state.participants.length > 0
      ? `Participants: ${state.participants.map((p) => p.name).join(", ")}`
      : null,
  ].filter(Boolean);

  return { preparedContext: parts.join("\n") };
}

function validateCoreOutputsNode(state: MeetingGraphStateType) {
  if (!state.summary) {
    throw new Error("Core analysis failed: summary agent did not produce output");
  }
  return {};
}

function aggregateCoreDraftNode(state: MeetingGraphStateType) {
  // validateCoreOutputsNode already guaranteed state.summary exists
  const draft = {
    analysisRunId: state.analysisRunId,
    meetingId: state.meetingId,
    summary: state.summary!,
    decisions: state.decisions,
    actionItems: state.actionItems,
    risksAndBlockers: state.risksAndBlockers,
    openQuestions: state.openQuestions,
    warnings: state.warnings,
    agentRuns: state.agentRuns,
    generatedAt: new Date().toISOString(),
  };

  // This is the actual Zod-validation enforcement point (spec section 4) —
  // if any node produced something that doesn't fit the contract, this
  // throws here rather than silently persisting bad data.
  const validated = coreDraftSchema.parse(draft);

  return { coreDraft: validated };
}

function humanReviewNode(state: MeetingGraphStateType) {
  const reviewed = interrupt({
    message:
      "Review the extracted decisions, action items, risks/blockers, and open questions before continuing.",
    decisions: state.decisions,
    actionItems: state.actionItems,
    risksAndBlockers: state.risksAndBlockers,
    openQuestions: state.openQuestions,
  }) as {
    decisions: MeetingGraphStateType["decisions"];
    actionItems: MeetingGraphStateType["actionItems"];
    risksAndBlockers: MeetingGraphStateType["risksAndBlockers"];
    openQuestions: MeetingGraphStateType["openQuestions"];
  };

  return { reviewedRecord: reviewed };
}

function finalizeRecordNode(state: MeetingGraphStateType) {
  // Uses the REVIEWED decisions/actionItems/etc (state.reviewedRecord),
  // not the raw extraction — this is the "reviewed-record precedence
  // after resume" requirement: whatever the user edited during human
  // review is what gets saved as final, not the original AI output.
  const record = {
    analysisRunId: state.analysisRunId,
    meetingId: state.meetingId,
    summary: state.summary!,
    decisions: state.reviewedRecord?.decisions ?? state.decisions,
    actionItems: state.reviewedRecord?.actionItems ?? state.actionItems,
    risksAndBlockers: state.reviewedRecord?.risksAndBlockers ?? state.risksAndBlockers,
    openQuestions: state.reviewedRecord?.openQuestions ?? state.openQuestions,
    followUp: state.followUp!,
    nextAgenda: state.nextAgenda!,
    warnings: state.warnings,
    agentRuns: state.agentRuns,
    generatedAt: new Date().toISOString(),
  };

  const validated = meetingAnalysisSchema.parse(record);
  return { finalRecord: validated };
}

export function createMeetingGraph(modelClient: MeetingModelClient) {
  const summaryNode = createSummaryNode(modelClient);
  const decisionNode = createDecisionNode(modelClient);
  const actionNode = createActionNode(modelClient);
  const riskNode = createRiskNode(modelClient);
  const followUpNode = createFollowUpNode(modelClient);
  const planningNode = createPlanningNode(modelClient);

  const builder = new StateGraph(MeetingGraphState)
    .addNode("validateInput", validateInputNode)
    .addNode("prepareContext", prepareContextNode)
    .addNode("summaryAgent", summaryNode)
    .addNode("decisionAgent", decisionNode)
    .addNode("actionAgent", actionNode)
    .addNode("riskAgent", riskNode)
    .addNode("validateCoreOutputs", validateCoreOutputsNode)
    .addNode("aggregateCoreDraft", aggregateCoreDraftNode)
    .addNode("humanReview", humanReviewNode)
    .addNode("followUpAgent", followUpNode)
    .addNode("planningAgent", planningNode)
    .addNode("finalizeRecord", finalizeRecordNode)

    .addEdge(START, "validateInput")
    .addEdge("validateInput", "prepareContext")

    .addEdge("prepareContext", "summaryAgent")
    .addEdge("prepareContext", "decisionAgent")
    .addEdge("prepareContext", "actionAgent")
    .addEdge("prepareContext", "riskAgent")

    .addEdge("summaryAgent", "validateCoreOutputs")
    .addEdge("decisionAgent", "validateCoreOutputs")
    .addEdge("actionAgent", "validateCoreOutputs")
    .addEdge("riskAgent", "validateCoreOutputs")

    .addEdge("validateCoreOutputs", "aggregateCoreDraft")
    .addEdge("aggregateCoreDraft", "humanReview")

    .addEdge("humanReview", "followUpAgent")
    .addEdge("humanReview", "planningAgent")

    .addEdge("followUpAgent", "finalizeRecord")
    .addEdge("planningAgent", "finalizeRecord")

    .addEdge("finalizeRecord", END);

  const checkpointer = createCheckpointer();
  return builder.compile({ checkpointer });
}