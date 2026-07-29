import type { MeetingModelClient } from "./MeetingModelClient";

export class MockMeetingModelClient implements MeetingModelClient {
  async generateStructured<T>(): Promise<{
    data: T;
    requestedModel: string;
    actualModel?: string;
    promptTokens?: number;
    completionTokens?: number;
    reasoningTokens?: number;
    durationMs: number;
    retryCount: number;
  }> {
    throw new Error("TODO: implement deterministic mock model client in your branch");
  }
}
