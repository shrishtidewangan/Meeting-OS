// export type AnalysisRunModelStub = {
//   id: string;
//   meetingId: string;
//   threadId: string;
//   status: string;
// };

// TODO: replace with a Mongoose schema in your branch.

import { Schema, model, Document, Types } from "mongoose";
import type { MeetingAnalysis } from "@meetingos/contracts";

export type AnalysisRunStatus =
  | "QUEUED"
  | "RUNNING"
  | "NEEDS_REVIEW"
  | "PARTIAL_FAILURE"
  | "FINALIZED"
  | "FAILED";

export interface IAnalysisRun extends Document {
  ownerId: Types.ObjectId;
  meetingId: Types.ObjectId;
  threadId: string;
  status: AnalysisRunStatus;
  requestedModel: string;
  actualModel?: string;
  warnings: { code: string; message: string; nodeName?: string }[];
  agentRuns: { nodeName: string; status: string; durationMs?: number; requestedModel?: string; actualModel?: string; promptTokens?: number; completionTokens?: number; reasoningTokens?: number; retryCount: number }[];
  sanitizedErrors: string[];
  retryCount: number;
  result?: MeetingAnalysis;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const warningSchema = new Schema(
  {
    code: { type: String, required: true },
    message: { type: String, required: true },
    nodeName: { type: String },
  },
  { _id: false }
);

const agentRunSchema = new Schema(
  {
    nodeName: { type: String, required: true },
    status: { type: String, enum: ["PENDING", "RUNNING", "SUCCEEDED", "FAILED", "FALLBACK"], required: true },
    durationMs: { type: Number },
    requestedModel: { type: String },
    actualModel: { type: String },
    promptTokens: { type: Number },
    completionTokens: { type: Number },
    reasoningTokens: { type: Number },
    retryCount: { type: Number, required: true },
  },
  { _id: false }
);

const analysisRunSchema = new Schema<IAnalysisRun>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    meetingId: { type: Schema.Types.ObjectId, ref: "Meeting", required: true, index: true },
    threadId: { type: String, required: true },
    status: {
      type: String,
      enum: ["QUEUED", "RUNNING", "NEEDS_REVIEW", "PARTIAL_FAILURE", "FINALIZED", "FAILED"],
      default: "QUEUED",
    },
    requestedModel: { type: String, required: true },
    actualModel: { type: String },
    warnings: { type: [warningSchema], default: [] },
    agentRuns: { type: [agentRunSchema], default: [] },
    sanitizedErrors: { type: [String], default: [] },
    retryCount: { type: Number, default: 0 },
    result: { type: Schema.Types.Mixed },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const AnalysisRun = model<IAnalysisRun>("AnalysisRun", analysisRunSchema);