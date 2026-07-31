// export const validationPackageReady = true;

// TODO: add shared Zod schemas for inputs, API envelopes, and model outputs.

import { z } from "zod";
import { meetingTypes } from "@meetingos/contracts";

// --- API envelope ---
export function apiSuccessSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({ ok: z.literal(true), data: dataSchema });
}
export const apiErrorSchema = z.object({
  ok: z.literal(false),
  error: z.object({ code: z.string(), message: z.string(), details: z.unknown().optional() }),
});
export function apiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.union([apiSuccessSchema(dataSchema), apiErrorSchema]);
}

// --- Meeting input ---
export const participantSchema = z.object({
  name: z.string().trim().min(1, "Participant name is required"),
});
export const meetingInputSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120, "Title must be at most 120 characters"),
  meetingType: z.enum(meetingTypes),
  meetingDate: z.string().refine((v) => !isNaN(Date.parse(v)), "Meeting date must be a valid date"),
  participants: z.array(participantSchema).max(30, "Participants list cannot exceed 30 names").optional(),
  projectOrAccountName: z.string().trim().max(120, "Project or account name must be at most 120 characters").optional(),
  context: z.string().max(2000, "Context must be at most 2000 characters").optional(),
  desiredOutcome: z.string().max(1000, "Desired outcome must be at most 1000 characters").optional(),
  transcript: z.string().min(200, "Transcript too short (minimum 200 characters)").max(60000, "Transcript too long (maximum 60000 characters)"),
});
export const meetingInputPartialSchema = meetingInputSchema.partial();

// --- Analysis / agent outputs ---
export const evidenceReferenceSchema = z.object({
  excerpt: z.string(),
  sourceType: z.enum(["TRANSCRIPT", "USER_CONTEXT", "INFERENCE"]),
  startOffset: z.number().optional(),
  endOffset: z.number().optional(),
});
export const meetingSummarySchema = z.object({
  executiveSummary: z.string(),
  themes: z.array(z.string()),
  outcome: z.enum(["CLEAR_OUTCOME", "PARTIAL_OUTCOME", "NO_CLEAR_OUTCOME"]),
});
export const decisionSchema = z.object({
  id: z.string(),
  statement: z.string(),
  owner: z.string().nullable(),
  evidence: evidenceReferenceSchema,
  confidence: z.number().min(0).max(1),
  inferred: z.boolean(),
});
export const actionItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  owner: z.string().nullable(),
  dueDate: z.string().nullable(),
  status: z.enum(["OPEN", "IN_PROGRESS", "DONE"]),
  dependencies: z.array(z.string()),
  evidence: evidenceReferenceSchema,
  confidence: z.number().min(0).max(1),
  ownerInferred: z.boolean(),
  dueDateInferred: z.boolean(),
  confirmedByUser: z.boolean(),
});
export const riskOrBlockerSchema = z.object({
  id: z.string(),
  type: z.enum(["RISK", "BLOCKER"]),
  description: z.string(),
  impact: z.enum(["LOW", "MEDIUM", "HIGH"]),
  mitigation: z.string().nullable(),
  owner: z.string().nullable(),
  evidence: evidenceReferenceSchema,
  confidence: z.number().min(0).max(1),
});
export const openQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  suggestedOwner: z.string().nullable(),
  reasonOpen: z.string().nullable(),
  evidence: evidenceReferenceSchema,
  confidence: z.number().min(0).max(1),
});
export const followUpDraftSchema = z.object({ subject: z.string(), body: z.string() });
export const nextAgendaSchema = z.object({
  title: z.string(),
  objectives: z.array(z.string()),
  items: z.array(z.string()),
  requiredPreparation: z.array(z.string()),
  suggestedAttendees: z.array(z.string()),
  suggestedDurationMinutes: z.number(),
});
export const analysisWarningSchema = z.object({
  code: z.string(),
  message: z.string(),
  nodeName: z.string().optional(),
});
export const agentRunSummarySchema = z.object({
  nodeName: z.string(),
  status: z.enum(["PENDING", "RUNNING", "SUCCEEDED", "FAILED", "FALLBACK"]),
  durationMs: z.number().optional(),
  requestedModel: z.string().optional(),
  actualModel: z.string().optional(),
  promptTokens: z.number().optional(),
  completionTokens: z.number().optional(),
  reasoningTokens: z.number().optional(),
  retryCount: z.number(),
});
export const meetingAnalysisSchema = z.object({
  analysisRunId: z.string(),
  meetingId: z.string(),
  summary: meetingSummarySchema,
  decisions: z.array(decisionSchema),
  actionItems: z.array(actionItemSchema),
  risksAndBlockers: z.array(riskOrBlockerSchema),
  openQuestions: z.array(openQuestionSchema),
  followUp: followUpDraftSchema,
  nextAgenda: nextAgendaSchema,
  warnings: z.array(analysisWarningSchema),
  agentRuns: z.array(agentRunSummarySchema),
  generatedAt: z.string(),
});

export const summaryOutputSchema = meetingSummarySchema;
export const decisionOutputSchema = z.object({ decisions: z.array(decisionSchema), openQuestions: z.array(openQuestionSchema) });
export const actionOutputSchema = z.object({ actionItems: z.array(actionItemSchema) });
export const riskOutputSchema = z.object({ risksAndBlockers: z.array(riskOrBlockerSchema) });
export const followUpOutputSchema = followUpDraftSchema;
export const planningOutputSchema = nextAgendaSchema;

// The core draft assembled by aggregateCoreDraftNode, BEFORE human review
// and before followUp/nextAgenda are generated. Same shape as
// meetingAnalysisSchema minus those two fields.
export const coreDraftSchema = meetingAnalysisSchema.omit({
  followUp: true,
  nextAgenda: true,
});

export const reviewedRecordSchema = z.object({
  decisions: z.array(decisionSchema),
  actionItems: z.array(actionItemSchema),
  risksAndBlockers: z.array(riskOrBlockerSchema),
  openQuestions: z.array(openQuestionSchema),
});