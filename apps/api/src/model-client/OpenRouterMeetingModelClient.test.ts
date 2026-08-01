import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

// Mock the entire @langchain/openrouter package so this test never makes
// a real network call — we control exactly what "the model" returns on
// each invocation, to simulate malformed output followed by a valid retry.
const mockInvoke = vi.fn();
vi.mock("@langchain/openrouter", () => {
  return {
    ChatOpenRouter: vi.fn().mockImplementation(() => ({
      withStructuredOutput: () => ({
        invoke: mockInvoke,
      }),
    })),
  };
});

import { OpenRouterMeetingModelClient } from "./OpenRouterMeetingModelClient";

const testSchema = z.object({
  greeting: z.string(),
});

describe("OpenRouterMeetingModelClient — malformed output retry", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it("retries once with validation feedback after malformed output, then succeeds", async () => {
    // First call: "model" returns something that fails the Zod schema
    // (missing the required "greeting" field entirely).
    mockInvoke.mockResolvedValueOnce({
      parsed: { wrongField: "this does not match the schema" },
      raw: { usage_metadata: { input_tokens: 10, output_tokens: 5 } },
    });

    // Second call (the retry): "model" returns valid, schema-matching output.
    mockInvoke.mockResolvedValueOnce({
      parsed: { greeting: "Hello, corrected!" },
      raw: {
        usage_metadata: { input_tokens: 12, output_tokens: 8 },
        response_metadata: { model: "mock/retry-test-model" },
      },
    });

    const client = new OpenRouterMeetingModelClient();

    const result = await client.generateStructured({
      nodeName: "testNode",
      systemPrompt: "You are a test agent.",
      userPrompt: "Say hello.",
      schema: testSchema,
    });

    // Confirm it actually called the model twice (original + one retry)
    expect(mockInvoke).toHaveBeenCalledTimes(2);

    // Confirm the retry's prompt included the actual validation feedback,
    // not just a generic "try again" — per spec's "concise validation
    // feedback" requirement.
    const secondCallMessages = mockInvoke.mock.calls[1][0];
    const secondUserMessage = secondCallMessages.find((m: any) => m.role === "user");
    expect(secondUserMessage.content).toMatch(/previous response failed validation/i);

    // Confirm the final result is the corrected, valid data
    expect(result.data).toEqual({ greeting: "Hello, corrected!" });
    expect(result.retryCount).toBe(1);
    expect(result.actualModel).toBe("mock/retry-test-model");
  });

  it("fails after exhausting retries if every attempt is malformed", async () => {
    mockInvoke.mockResolvedValue({
      parsed: { wrongField: "always invalid" },
      raw: {},
    });

    const client = new OpenRouterMeetingModelClient();

    await expect(
      client.generateStructured({
        nodeName: "testNode",
        systemPrompt: "You are a test agent.",
        userPrompt: "Say hello.",
        schema: testSchema,
      })
    ).rejects.toThrow(/OpenRouter request failed for node "testNode"/);

    // AI_MAX_RETRIES defaults to 1, so 2 total attempts (original + 1 retry)
    expect(mockInvoke).toHaveBeenCalledTimes(2);
  });
});