// Runs the real project-meeting fixture through the full LangGraph
// pipeline, once with openrouter/free and once with the configured
// reasoning-capable model, printing results for manual comparison.
// Requires OPENROUTER_API_KEY to be set in .env — this is a LIVE
// evaluation and spends real API usage.
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { createMeetingGraph } from "../graph/graph";
import { OpenRouterMeetingModelClient } from "../model-client/OpenRouterMeetingModelClient";
import { getEnv } from "../config/env";

const env = getEnv();

async function runComparison(label: string, modelId: string) {
  console.log(`\n=== ${label} (${modelId}) ===\n`);

  const transcriptPath = path.resolve(
    process.cwd(),
    "../../packages/test-fixtures/transcripts/project-meeting.md"
  );
  const transcript = fs.readFileSync(transcriptPath, "utf-8");

  const client = new OpenRouterMeetingModelClient();
  const originalGenerate = client.generateStructured.bind(client);
  client.generateStructured = (input: any) =>
    originalGenerate({ ...input, requestedModel: modelId });

  const graph = createMeetingGraph(client);
  const threadId = `eval-${label}-${Date.now()}`;
  const config = { configurable: { thread_id: threadId } };

  const started = Date.now();
  const result: any = await graph.invoke(
    {
      meetingId: "eval-meeting",
      analysisRunId: "eval-run",
      threadId,
      transcript,
      meetingType: "PROJECT",
      meetingDate: new Date().toISOString(),
      participants: [],
    },
    config
  );
  const totalLatency = Date.now() - started;

  console.log("Total latency (ms):", totalLatency);
  console.log("Agent runs:", JSON.stringify(result.agentRuns, null, 2));
  console.log("Warnings:", JSON.stringify(result.warnings, null, 2));
  console.log("Core draft:", JSON.stringify(result.coreDraft, null, 2));
}

async function main() {
  if (!env.OPENROUTER_API_KEY) {
    console.error("OPENROUTER_API_KEY is not set — cannot run a live evaluation.");
    process.exit(1);
  }

  await mongoose.connect(env.MONGODB_URI);

  await runComparison("openrouter-free", "openrouter/free");
  await runComparison(
    "reasoning-model",
    env.OPENROUTER_REASONING_MODEL ?? "nvidia/nemotron-3-ultra-550b-a55b:free"
  );

  process.exit(0);
}

main().catch((err) => {
  console.error("Evaluation failed:", err);
  process.exit(1);
});