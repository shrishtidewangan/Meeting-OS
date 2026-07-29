import type { z } from "zod";

export interface MeetingModelClient {
  generateStructured<T>(input: {
    nodeName: string;
    systemPrompt: string;
    userPrompt: string;
    schema: z.ZodType<T>;
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
  }>;
}

