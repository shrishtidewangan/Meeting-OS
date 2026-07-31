// import type { MeetingModelClient } from "./MeetingModelClient";

// export class MockMeetingModelClient implements MeetingModelClient {
//   async generateStructured<T>(): Promise<{
//     data: T;
//     requestedModel: string;
//     actualModel?: string;
//     promptTokens?: number;
//     completionTokens?: number;
//     reasoningTokens?: number;
//     durationMs: number;
//     retryCount: number;
//   }> {
//     throw new Error("TODO: implement deterministic mock model client in your branch");
//   }
// }

import type { MeetingModelClient } from "./MeetingModelClient";

// Canned, schema-valid responses keyed by nodeName. Deliberately generic
// (not tied to any transcript's actual content) — this client exists to
// prove the GRAPH mechanics work (parallel execution, validation,
// interrupt/resume) without calling a real model or depending on the
// actual transcript text.
const CANNED_RESPONSES: Record<string, unknown> = {
  summaryAgent: {
    executiveSummary: "Mock summary generated without calling a live model.",
    themes: ["Mock theme"],
    outcome: "PARTIAL_OUTCOME",
  },
  decisionAgent: {
    decisions: [
      {
        id: "mock-decision-1",
        statement: "Mock decision statement.",
        owner: null,
        evidence: { excerpt: "Mock evidence excerpt.", sourceType: "TRANSCRIPT" },
        confidence: 0.75,
        inferred: false,
      },
    ],
    openQuestions: [
      {
        id: "mock-question-1",
        question: "Mock open question.",
        suggestedOwner: null,
        reasonOpen: "Mock reason this remains unresolved.",
        evidence: { excerpt: "Mock evidence excerpt.", sourceType: "TRANSCRIPT" },
        confidence: 0.6,
      },
    ],
  },
  actionAgent: {
    actionItems: [
      {
        id: "mock-action-1",
        title: "Mock action item.",
        description: null,
        owner: null,
        dueDate: null,
        status: "OPEN",
        dependencies: [],
        evidence: { excerpt: "Mock evidence excerpt.", sourceType: "TRANSCRIPT" },
        confidence: 0.7,
        ownerInferred: false,
        dueDateInferred: false,
        confirmedByUser: false,
      },
    ],
  },
  riskAgent: {
    risksAndBlockers: [
      {
        id: "mock-risk-1",
        type: "RISK",
        description: "Mock risk description.",
        impact: "MEDIUM",
        mitigation: null,
        owner: null,
        evidence: { excerpt: "Mock evidence excerpt.", sourceType: "TRANSCRIPT" },
        confidence: 0.65,
      },
    ],
  },
  followUpAgent: {
    subject: "Mock follow-up subject",
    body: "Mock follow-up email body generated from reviewed data.",
  },
  planningAgent: {
    title: "Mock next-meeting agenda",
    objectives: ["Mock objective"],
    items: ["Mock agenda item"],
    requiredPreparation: [],
    suggestedAttendees: [],
    suggestedDurationMinutes: 30,
  },
};

export class MockMeetingModelClient implements MeetingModelClient {
  async generateStructured<T>(input: {
    nodeName: string;
    systemPrompt: string;
    userPrompt: string;
    schema: import("zod").ZodType<T>;
    requestedModel?: string;
    reasoningEffort?: string;
    timeoutMs?: number;
  }): Promise<{
    data: T;
    requestedModel: string;
    actualModel?: string;
    promptTokens?: number;
    completionTokens?: number;
    reasoningTokens?: number;
    durationMs: number;
    retryCount: number;
  }> {
    const started = Date.now();

    const canned = CANNED_RESPONSES[input.nodeName];
    if (canned === undefined) {
      throw new Error(`MockMeetingModelClient has no canned response for node "${input.nodeName}"`);
    }

    // Validate the canned response against the same schema a real model's
    // output would need to pass — catches a mismatch immediately in tests.
    const data = input.schema.parse(canned);

    return {
      data,
      requestedModel: input.requestedModel ?? "mock",
      actualModel: "mock",
      promptTokens: 0,
      completionTokens: 0,
      reasoningTokens: 0,
      durationMs: Date.now() - started,
      retryCount: 0,
    };
  }
}