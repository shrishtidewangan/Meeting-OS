// export class AnalysisService {
//   startAnalysis() {
//     throw new Error("TODO: implement LangGraph analysis orchestration in your branch");
//   }
// }

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { AnalysisRun, type AnalysisRunStatus } from "../models/analysisRun.model";
import { Meeting } from "../models/meeting.model";
import { MeetingService } from "./meeting.service";
import { getEnv } from "../config/env";
import type { MeetingAnalysis } from "@meetingos/contracts";

const meetingService = new MeetingService();
const env = getEnv();

// Fixture files live at packages/test-fixtures/mock-results/<scenario>.analysis.json
const FIXTURES_DIR = path.resolve(process.cwd(), "../../packages/test-fixtures/mock-results");

const VALID_SCENARIOS = ["success", "partial-failure", "timeout", "malformed-output"] as const;
type MockScenario = (typeof VALID_SCENARIOS)[number];

// Maps each mock scenario to the resulting run/meeting status.
// success reaches human review cleanly; partial-failure and malformed-output
// still reach review but are flagged; timeout never completes at all.
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
  // Starts a mock analysis run for an owned meeting.
  // scenario defaults to env.MOCK_AI_SCENARIO if not explicitly passed.
  async startAnalysis(ownerId: string, meetingId: string, scenario?: string) {
    // Ensures the meeting exists and belongs to this user (404/403 as usual)
    const meeting = await meetingService.getMeeting(ownerId, meetingId);

    const chosenScenario = scenario ?? env.MOCK_AI_SCENARIO;
    const fixture = loadFixture(chosenScenario);

    // Generate the AnalysisRun's _id upfront so it can be embedded in the
    // result as analysisRunId BEFORE saving — this guarantees the document's
    // real _id and the analysisRunId inside its stored result always match,
    // which matters since GET /analysis/:analysisRunId looks up by _id.
    const runObjectId = new mongoose.Types.ObjectId();
    const threadId = crypto.randomUUID();
    const status = SCENARIO_STATUS[chosenScenario as MockScenario];

    const result: MeetingAnalysis = {
      ...fixture,
      analysisRunId: runObjectId.toString(),
      meetingId: meeting._id.toString(),
      generatedAt: new Date().toISOString(),
    };

    const run = await AnalysisRun.create({
      _id: runObjectId,
      ownerId,
      meetingId: meeting._id,
      threadId,
      status,
      requestedModel: "mock",
      actualModel: "mock",
      warnings: result.warnings ?? [],
      sanitizedErrors: [],
      retryCount: 0,
      result,
      startedAt: new Date(),
      completedAt: new Date(),
    });

    // Reflect the outcome on the meeting itself so the dashboard/details
    // pages can show current status without a second lookup.
    meeting.status = status;
    meeting.latestGeneratedDraft = result;
    await meeting.save();

    return run;
  }

  // Fetches a run, but only if the requesting user owns the underlying meeting.
  async getAnalysisRun(ownerId: string, analysisRunId: string) {
    if (!mongoose.isValidObjectId(analysisRunId)) {
      throw new Error("Analysis run not found");
    }
    const run = await AnalysisRun.findOne({ _id: analysisRunId, ownerId });
    if (!run) {
      throw new Error("Analysis run not found");
    }
    return run;
  }

  // Same as above, but also confirms the run belongs to the given meetingId
  // (used by the /meetings/:meetingId/analysis/:analysisRunId route).
  async getAnalysisRunForMeeting(ownerId: string, meetingId: string, analysisRunId: string) {
    if (!mongoose.isValidObjectId(analysisRunId) || !mongoose.isValidObjectId(meetingId)) {
      throw new Error("Analysis run not found");
    }
    const run = await AnalysisRun.findOne({ _id: analysisRunId, ownerId, meetingId });
    if (!run) {
      throw new Error("Analysis run not found");
    }
    return run;
  }
}