// export class AnalysisService {
//   startAnalysis() {
//     throw new Error("TODO: implement LangGraph analysis orchestration in your branch");
//   }
// }

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { AnalysisRunRepository } from "../repositories/analysisRun.repository";
import type { AnalysisRunStatus } from "../models/analysisRun.model";
import { MeetingService } from "./meeting.service";
import { getEnv } from "../config/env";
import type { MeetingAnalysis } from "@meetingos/contracts";
import { Command } from "@langchain/langgraph";
import { createMeetingGraph } from "../graph/graph";
import { MockMeetingModelClient } from "../model-client/MockMeetingModelClient";
import { reviewedRecordSchema } from "@meetingos/validation";
import { logInfo } from "../observability/logger";

// IMPORTANT: this must be a single shared instance, not created fresh per
// call. MemorySaver's checkpoints only exist in-memory on this specific
// object — a resume call needs to find the SAME checkpointer that the
// original start call paused on, which only works if both calls share
// this one graph instance within the running server process.
const mockGraph = createMeetingGraph(new MockMeetingModelClient());
const meetingService = new MeetingService();
const analysisRunRepository = new AnalysisRunRepository();
const env = getEnv();

// Fixture files live at packages/test-fixtures/mock-results/<scenario>.analysis.json
const FIXTURES_DIR = path.resolve(process.cwd(), "../../packages/test-fixtures/mock-results");

const VALID_SCENARIOS = ["success", "partial-failure", "timeout", "malformed-output"] as const;
type MockScenario = (typeof VALID_SCENARIOS)[number];

const SCENARIO_STATUS: Record<MockScenario, AnalysisRunStatus> = {
  success: "NEEDS_REVIEW",
  "partial-failure": "PARTIAL_FAILURE",
  "malformed-output": "PARTIAL_FAILURE",
  timeout: "FAILED",
};

function loadFixture(scenario: string): MeetingAnalysis {
  if (!VALID_SCENARIOS.includes(scenario as MockScenario)) {
    throw new Error(
      `Unknown mock scenario "${scenario}". Valid options: ${VALID_SCENARIOS.join(", ")}`
    );
  }

  const filePath = path.join(FIXTURES_DIR, `${scenario}.analysis.json`);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as MeetingAnalysis;
}

export class AnalysisService {
  async startAnalysis(ownerId: string, meetingId: string, scenario?: string) {
    // Reuses MeetingService's ownership check (404/403), which itself now
    // goes through MeetingRepository.
    const meeting = await meetingService.getMeeting(ownerId, meetingId);

    const chosenScenario = scenario ?? env.MOCK_AI_SCENARIO;
    const fixture = loadFixture(chosenScenario);

    // Generate the AnalysisRun's _id upfront so it can be embedded in the
    // result as analysisRunId BEFORE saving.
    const runObjectId = new mongoose.Types.ObjectId();
    const threadId = crypto.randomUUID();
    const status = SCENARIO_STATUS[chosenScenario as MockScenario];

    const result: MeetingAnalysis = {
      ...fixture,
      analysisRunId: runObjectId.toString(),
      meetingId: meeting._id.toString(),
      generatedAt: new Date().toISOString(),
    };

    const run = await analysisRunRepository.create({
      _id: runObjectId,
      ownerId,
      meetingId: meeting._id,
      threadId,
      status,
      requestedModel: "mock",
      actualModel: "mock",
      warnings: result.warnings ?? [],
      agentRuns: result.agentRuns ?? [],
      sanitizedErrors: [],
      retryCount: 0,
      result,
      startedAt: new Date(),
      completedAt: new Date(),
    } as any);

    meeting.status = status;
    meeting.latestGeneratedDraft = result;
    await meeting.save();

    return run;
  }

  async getAnalysisRun(ownerId: string, analysisRunId: string) {
    if (!mongoose.isValidObjectId(analysisRunId)) {
      throw new Error("Analysis run not found");
    }
    const run = await analysisRunRepository.findById(analysisRunId, ownerId);
    if (!run) {
      throw new Error("Analysis run not found");
    }
    return run;
  }

  async resumeGraphAnalysis(
    ownerId: string,
    meetingId: string,
    analysisRunId: string,
    reviewedRecord: unknown
  ) {
    // Ownership + existence check for both the meeting and the run.
    const meeting = await meetingService.getMeeting(ownerId, meetingId);
    if (!mongoose.isValidObjectId(analysisRunId)) {
      throw new Error("Analysis run not found");
    }
    const run = await analysisRunRepository.findByIdAndMeeting(analysisRunId, meetingId, ownerId);
    if (!run) {
      throw new Error("Analysis run not found");
    }
    if (run.status !== "NEEDS_REVIEW" && run.status !== "PARTIAL_FAILURE") {
      throw new Error(`Cannot resume a run with status "${run.status}"`);
    }

    // Validate the user's edits against the same schema the core draft used.
    const validatedReview = reviewedRecordSchema.parse(reviewedRecord);

    const config = { configurable: { thread_id: run.threadId } };
    const result: any = await mockGraph.invoke(new Command({ resume: validatedReview }), config);

    if (!result.finalRecord) {
      throw new Error("Graph did not produce a final record after resume");
    }

    run.status = "FINALIZED";
    run.result = result.finalRecord;
    run.agentRuns = result.agentRuns ?? run.agentRuns;
    run.warnings = result.warnings ?? run.warnings;
    run.completedAt = new Date();
    logInfo("Analysis run resumed and finalized", {
      meetingId,
      analysisRunId,
      status: run.status,
    });
    await run.save();

    meeting.status = "FINALIZED";
    meeting.latestReviewedRecord = validatedReview;
    meeting.followUpEmail = result.finalRecord.followUp;
    meeting.nextAgenda = result.finalRecord.nextAgenda;
    await meeting.save();

    return run;
  }

  async getAnalysisRunForMeeting(ownerId: string, meetingId: string, analysisRunId: string) {
    if (!mongoose.isValidObjectId(analysisRunId) || !mongoose.isValidObjectId(meetingId)) {
      throw new Error("Analysis run not found");
    }
    const run = await analysisRunRepository.findByIdAndMeeting(analysisRunId, meetingId, ownerId);
    if (!run) {
      throw new Error("Analysis run not found");
    }
    return run;
  }

  async retryAnalysis(ownerId: string, meetingId: string, analysisRunId: string) {
    // Ownership + existence check for both the meeting and the run.
    await meetingService.getMeeting(ownerId, meetingId);
    if (!mongoose.isValidObjectId(analysisRunId)) {
      throw new Error("Analysis run not found");
    }
    const failedRun = await analysisRunRepository.findByIdAndMeeting(analysisRunId, meetingId, ownerId);
    if (!failedRun) {
      throw new Error("Analysis run not found");
    }
    if (failedRun.status !== "FAILED" && failedRun.status !== "PARTIAL_FAILURE") {
      throw new Error(`Cannot retry a run with status "${failedRun.status}"`);
    }

    logInfo("Retrying failed analysis run", {
      meetingId,
      previousAnalysisRunId: analysisRunId,
      previousStatus: failedRun.status,
    });

    // Retry creates a FRESH run rather than resuming the failed run's
    // checkpoint — a run that never reached human review (FAILED) or
    // that failed a core node (PARTIAL_FAILURE) doesn't have a reliable
    // paused state to resume from. The old run stays in the database as
    // a historical record; this is a genuinely new attempt.
    const { run: newRun } = await this.startGraphAnalysis(ownerId, meetingId);
    return newRun;
  }

  async startGraphAnalysis(ownerId: string, meetingId: string) {
  const meeting = await meetingService.getMeeting(ownerId, meetingId);

  const runObjectId = new mongoose.Types.ObjectId();
  const threadId = crypto.randomUUID();

  const graph = mockGraph; // shared instance — see comment above

  const initialState = {
    meetingId: meeting._id.toString(),
    analysisRunId: runObjectId.toString(),
    threadId,
    transcript: meeting.transcript,
    meetingType: meeting.meetingType,
    meetingDate: meeting.meetingDate.toISOString(),
    participants: meeting.participants,
    projectOrAccountName: meeting.projectOrAccountName,
    context: meeting.context,
    desiredOutcome: meeting.desiredOutcome,
  };

  const config = { configurable: { thread_id: threadId } };

  // result.__interrupt__ and result.coreDraft shape confirmed via real
  // testing — see WIRING_ANALYSIS.md / eval-comparison runs.
  const result: any = await graph.invoke(initialState, config);

  const wasInterrupted = Boolean(result.__interrupt__);
  const status = wasInterrupted && result.coreDraft ? "NEEDS_REVIEW" : "FAILED";

  logInfo("Analysis run started", {
    meetingId: meeting._id.toString(),
    analysisRunId: runObjectId.toString(),
    status,
    agentCount: result.agentRuns?.length ?? 0,
  });

  const run = await analysisRunRepository.create({
    _id: runObjectId,
    ownerId,
    meetingId: meeting._id,
    threadId,
    status,
    requestedModel: "mock",
    actualModel: "mock",
    warnings: result.warnings ?? [],
    agentRuns: result.agentRuns ?? [],
    sanitizedErrors: wasInterrupted ? [] : ["Graph did not reach human review as expected"],
    retryCount: 0,
    result: result.coreDraft ?? null,
    startedAt: new Date(),
  } as any);

  meeting.status = status;
  if (result.coreDraft) {
    meeting.latestGeneratedDraft = result.coreDraft;
  }
  await meeting.save();

  return { run, rawResult: result };
}
}