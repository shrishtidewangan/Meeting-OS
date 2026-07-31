// Re-exports the shared schemas from @meetingos/validation, which is the
// single source of truth for these shapes (defined once, used by both
// this graph and anywhere else in the app that needs them). This file
// exists so the schemas are visibly present in the folder the spec
// designates for them, rather than only living in packages/validation.
export {
  summaryOutputSchema,
  decisionOutputSchema,
  actionOutputSchema,
  riskOutputSchema,
  followUpOutputSchema,
  planningOutputSchema,
  coreDraftSchema,
  decisionSchema,
  openQuestionSchema,
  actionItemSchema,
  riskOrBlockerSchema,
  evidenceReferenceSchema,
} from "@meetingos/validation";

import type {
  summaryOutputSchema as _summary,
  decisionOutputSchema as _decisionOut,
  actionOutputSchema as _actionOut,
  riskOutputSchema as _riskOut,
  followUpOutputSchema as _followUpOut,
  planningOutputSchema as _planningOut,
  coreDraftSchema as _coreDraft
} from "@meetingos/validation";
import type { z } from "zod";
import type { Decision, ActionItem, RiskOrBlocker, OpenQuestion } from "@meetingos/contracts";

export type { Decision, ActionItem, RiskOrBlocker, OpenQuestion };

export type SummaryOutput = z.infer<typeof _summary>;
export type DecisionOutput = z.infer<typeof _decisionOut>;
export type ActionOutput = z.infer<typeof _actionOut>;
export type RiskOutput = z.infer<typeof _riskOut>;
export type FollowUpOutput = z.infer<typeof _followUpOut>;
export type PlanningOutput = z.infer<typeof _planningOut>;
export type CoreDraft = z.infer<typeof _coreDraft>;