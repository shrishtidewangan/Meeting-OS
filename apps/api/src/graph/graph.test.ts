import { describe, it, expect } from "vitest";
import { Command } from "@langchain/langgraph";
import { createMeetingGraph } from "./graph";
import { MockMeetingModelClient } from "../model-client/MockMeetingModelClient";
import { coreDraftSchema } from "@meetingos/validation";

function buildInitialState(overrides: Record<string, unknown> = {}) {
  return {
    meetingId: "meeting-1",
    analysisRunId: "run-1",
    threadId: `thread-${Math.random()}`,
    transcript: "a".repeat(250),
    meetingType: "PROJECT" as const,
    meetingDate: new Date().toISOString(),
    participants: [],
    projectOrAccountName: undefined,
    context: undefined,
    desiredOutcome: undefined,
    ...overrides,
  };
}

describe("meeting graph", () => {
  it("runs the four core agents in parallel and pauses at human review with a valid core draft", async () => {
    const graph = createMeetingGraph(new MockMeetingModelClient());
    const threadId = `thread-${Date.now()}-a`;
    const config = { configurable: { thread_id: threadId } };

    const result: any = await graph.invoke(buildInitialState({ threadId }), config);

    expect(result.__interrupt__).toBeTruthy();

    expect(result.coreDraft).toBeTruthy();
    const parsed = coreDraftSchema.safeParse(result.coreDraft);
    expect(parsed.success).toBe(true);

    const nodeNames = result.agentRuns.map((r: any) => r.nodeName).sort();
    expect(nodeNames).toEqual(["actionAgent", "decisionAgent", "riskAgent", "summaryAgent"]);
    for (const run of result.agentRuns) {
      expect(run.status).toBe("SUCCEEDED");
    }
  });

  it("rejects a transcript that is too short before running any agent", async () => {
    const graph = createMeetingGraph(new MockMeetingModelClient());
    const threadId = `thread-${Date.now()}-b`;
    const config = { configurable: { thread_id: threadId } };

    await expect(
      graph.invoke(buildInitialState({ threadId, transcript: "too short" }), config)
    ).rejects.toThrow(/Transcript too short/);
  });

  it("resumes after human review and runs the follow-up and planning agents", async () => {
    const graph = createMeetingGraph(new MockMeetingModelClient());
    const threadId = `thread-${Date.now()}-c`;
    const config = { configurable: { thread_id: threadId } };

    const paused: any = await graph.invoke(buildInitialState({ threadId }), config);
    expect(paused.__interrupt__).toBeTruthy();

    const reviewed = {
      decisions: paused.coreDraft.decisions,
      actionItems: paused.coreDraft.actionItems,
      risksAndBlockers: paused.coreDraft.risksAndBlockers,
      openQuestions: paused.coreDraft.openQuestions,
    };

    const final: any = await graph.invoke(new Command({ resume: reviewed }), config);

    expect(final.followUp).toBeTruthy();
    expect(final.nextAgenda).toBeTruthy();

    const nodeNames = final.agentRuns.map((r: any) => r.nodeName).sort();
    expect(nodeNames).toEqual([
      "actionAgent",
      "decisionAgent",
      "followUpAgent",
      "planningAgent",
      "riskAgent",
      "summaryAgent",
    ]);
  });
});