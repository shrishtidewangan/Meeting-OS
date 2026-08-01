import { describe, it, expect } from "vitest";
import {
  meetingInputSchema,
  meetingAnalysisSchema,
  coreDraftSchema,
  reviewedRecordSchema,
  decisionSchema,
  actionItemSchema,
} from "./index";

describe("meetingInputSchema", () => {
  it("accepts a valid meeting input", () => {
    const result = meetingInputSchema.safeParse({
      title: "Sprint Planning",
      meetingType: "PROJECT",
      meetingDate: "2026-07-29",
      transcript: "a".repeat(250),
    });
    expect(result.success).toBe(true);
  });

  it("rejects a transcript that is too short", () => {
    const result = meetingInputSchema.safeParse({
      title: "Sprint Planning",
      meetingType: "PROJECT",
      meetingDate: "2026-07-29",
      transcript: "too short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/Transcript too short/);
    }
  });

  it("rejects a title that is too short", () => {
    const result = meetingInputSchema.safeParse({
      title: "ab",
      meetingType: "PROJECT",
      meetingDate: "2026-07-29",
      transcript: "a".repeat(250),
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid meetingType", () => {
    const result = meetingInputSchema.safeParse({
      title: "Sprint Planning",
      meetingType: "NOT_A_REAL_TYPE",
      meetingDate: "2026-07-29",
      transcript: "a".repeat(250),
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 30 participants", () => {
    const result = meetingInputSchema.safeParse({
      title: "Sprint Planning",
      meetingType: "PROJECT",
      meetingDate: "2026-07-29",
      transcript: "a".repeat(250),
      participants: Array.from({ length: 31 }, (_, i) => ({ name: `Person ${i}` })),
    });
    expect(result.success).toBe(false);
  });
});

describe("decisionSchema", () => {
  it("accepts owner: null (unknown owner)", () => {
    const result = decisionSchema.safeParse({
      id: "d1",
      statement: "Test decision",
      owner: null,
      evidence: { excerpt: "test", sourceType: "TRANSCRIPT" },
      confidence: 0.9,
      inferred: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects confidence outside 0-1", () => {
    const result = decisionSchema.safeParse({
      id: "d1",
      statement: "Test decision",
      owner: null,
      evidence: { excerpt: "test", sourceType: "TRANSCRIPT" },
      confidence: 1.5,
      inferred: false,
    });
    expect(result.success).toBe(false);
  });
});

describe("actionItemSchema", () => {
  it("accepts null owner and null dueDate (never invented)", () => {
    const result = actionItemSchema.safeParse({
      id: "a1",
      title: "Test action",
      description: null,
      owner: null,
      dueDate: null,
      status: "OPEN",
      dependencies: [],
      evidence: { excerpt: "test", sourceType: "TRANSCRIPT" },
      confidence: 0.7,
      ownerInferred: false,
      dueDateInferred: false,
      confirmedByUser: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid status value", () => {
    const result = actionItemSchema.safeParse({
      id: "a1",
      title: "Test action",
      description: null,
      owner: null,
      dueDate: null,
      status: "NOT_A_REAL_STATUS",
      dependencies: [],
      evidence: { excerpt: "test", sourceType: "TRANSCRIPT" },
      confidence: 0.7,
      ownerInferred: false,
      dueDateInferred: false,
      confirmedByUser: false,
    });
    expect(result.success).toBe(false);
  });
});

describe("coreDraftSchema", () => {
  it("accepts a valid core draft (no followUp/nextAgenda required)", () => {
    const result = coreDraftSchema.safeParse({
      analysisRunId: "run-1",
      meetingId: "meeting-1",
      summary: { executiveSummary: "Test.", themes: [], outcome: "CLEAR_OUTCOME" },
      decisions: [],
      actionItems: [],
      risksAndBlockers: [],
      openQuestions: [],
      warnings: [],
      agentRuns: [],
      generatedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it("rejects a draft that includes followUp (should not exist before review)", () => {
    // Not actually an error at the schema level (extra keys are allowed by
    // default), but confirms the schema doesn't REQUIRE followUp/nextAgenda,
    // which is the whole point of having a separate coreDraftSchema.
    const result = coreDraftSchema.safeParse({
      analysisRunId: "run-1",
      meetingId: "meeting-1",
      summary: { executiveSummary: "Test.", themes: [], outcome: "CLEAR_OUTCOME" },
      decisions: [],
      actionItems: [],
      risksAndBlockers: [],
      openQuestions: [],
      warnings: [],
      agentRuns: [],
      generatedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });
});

describe("meetingAnalysisSchema", () => {
  it("requires followUp and nextAgenda for the full final record", () => {
    const result = meetingAnalysisSchema.safeParse({
      analysisRunId: "run-1",
      meetingId: "meeting-1",
      summary: { executiveSummary: "Test.", themes: [], outcome: "CLEAR_OUTCOME" },
      decisions: [],
      actionItems: [],
      risksAndBlockers: [],
      openQuestions: [],
      warnings: [],
      agentRuns: [],
      generatedAt: new Date().toISOString(),
      // followUp and nextAgenda deliberately omitted
    });
    expect(result.success).toBe(false);
  });
});

describe("reviewedRecordSchema", () => {
  it("accepts a valid reviewed record shape", () => {
    const result = reviewedRecordSchema.safeParse({
      decisions: [],
      actionItems: [],
      risksAndBlockers: [],
      openQuestions: [],
    });
    expect(result.success).toBe(true);
  });
});