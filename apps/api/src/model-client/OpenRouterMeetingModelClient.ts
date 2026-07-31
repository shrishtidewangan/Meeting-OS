// import type { MeetingModelClient } from "./MeetingModelClient";

// export class OpenRouterMeetingModelClient implements MeetingModelClient {
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
//     throw new Error("TODO: implement OpenRouter model client in your branch");
//   }
// }
import { ChatOpenRouter } from "@langchain/openrouter";
import type { MeetingModelClient } from "./MeetingModelClient";
import { getEnv } from "../config/env";
import { logInfo } from "../observability/logger";

const env = getEnv();

export class OpenRouterMeetingModelClient implements MeetingModelClient {
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
    const requestedModel = input.requestedModel ?? env.OPENROUTER_MODEL;
    const timeoutMs = input.timeoutMs ?? env.AI_REQUEST_TIMEOUT_MS;
    const maxRetries = env.AI_MAX_RETRIES;

    let lastError: unknown;
    let lastValidationFeedback: string | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const started = Date.now();

      logInfo("OpenRouter request attempt", {
        nodeName: input.nodeName,
        requestedModel,
        attempt: attempt + 1,
      });

      try {
        const model = new ChatOpenRouter({
          model: requestedModel,
          apiKey: env.OPENROUTER_API_KEY,
          modelKwargs: {
            reasoning: {
              effort: input.reasoningEffort ?? env.OPENROUTER_REASONING_EFFORT,
            },
          },
        });

        // includeRaw: true is what actually gives us access to token usage
        // and response metadata — confirmed against LangChain's documented
        // behavior: { raw: AIMessage, parsed: RunOutput }. Without this
        // flag, withStructuredOutput() returns ONLY the parsed data with
        // no metadata at all (confirmed by testing against a real response).
        const structuredModel = model.withStructuredOutput(input.schema, {
          includeRaw: true,
        });

        const userPrompt = lastValidationFeedback
          ? `${input.userPrompt}\n\nYour previous response failed validation with this error, please correct it: ${lastValidationFeedback}`
          : input.userPrompt;

        const invokePromise = structuredModel.invoke([
          { role: "system", content: input.systemPrompt },
          { role: "user", content: userPrompt },
        ]);

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Model request timed out after ${timeoutMs}ms`)), timeoutMs);
        });

        const result: any = await Promise.race([invokePromise, timeoutPromise]);

        if (result.parsed === null || result.parsed === undefined) {
          throw new Error("Model output did not match the expected schema");
        }

        // Re-validate locally even though withStructuredOutput already
        // validated internally — per spec's explicit requirement to
        // validate with Zod regardless of provider-side structured output.
        const validated = input.schema.parse(result.parsed);

        const usage = result.raw?.usage_metadata ?? {};
        const actualModel = result.raw?.response_metadata?.model ?? undefined;

        logInfo("OpenRouter request succeeded", {
          nodeName: input.nodeName,
          requestedModel,
          actualModel,
          durationMs: Date.now() - started,
        });

        return {
          data: validated,
          requestedModel,
          actualModel,
          promptTokens: usage.input_tokens,
          completionTokens: usage.output_tokens,
          reasoningTokens: usage.output_token_details?.reasoning,
          durationMs: Date.now() - started,
          retryCount: attempt,
        };
      } catch (err) {
        lastError = err;
        lastValidationFeedback = err instanceof Error ? err.message : "Unknown validation error";
        if (attempt < maxRetries) {
          continue;
        }
      }
    }

    throw new Error(
      `OpenRouter request failed for node "${input.nodeName}" after ${maxRetries + 1} attempt(s): ${
        lastError instanceof Error ? lastError.message : "Unknown error"
      }`
    );
  }
}