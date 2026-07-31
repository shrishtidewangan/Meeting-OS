export type EvidenceReference = {
  excerpt: string;
  sourceType: "TRANSCRIPT" | "USER_CONTEXT" | "INFERENCE";
  startOffset?: number;
  endOffset?: number;
};

export type MeetingSummary = {
  executiveSummary: string;
  themes: string[];
  outcome: "CLEAR_OUTCOME" | "PARTIAL_OUTCOME" | "NO_CLEAR_OUTCOME";
};

export type Decision = {
  id: string;
  statement: string;
  owner: string | null;
  evidence: EvidenceReference;
  confidence: number;
  inferred: boolean;
};

export type ActionItem = {
  id: string;
  title: string;
  description: string | null;
  owner: string | null;
  dueDate: string | null;
  status: "OPEN" | "IN_PROGRESS" | "DONE";
  dependencies: string[];
  evidence: EvidenceReference;
  confidence: number;
  ownerInferred: boolean;
  dueDateInferred: boolean;
  confirmedByUser: boolean;
};

export type RiskOrBlocker = {
  id: string;
  type: "RISK" | "BLOCKER";
  description: string;
  impact: "LOW" | "MEDIUM" | "HIGH";
  mitigation: string | null;
  owner: string | null;
  evidence: EvidenceReference;
  confidence: number;
};

export type OpenQuestion = {
  id: string;
  question: string;
  suggestedOwner: string | null;
  reasonOpen: string | null;
  evidence: EvidenceReference;
  confidence: number;
};

export type FollowUpDraft = {
  subject: string;
  body: string;
};

export type NextAgenda = {
  title: string;
  objectives: string[];
  items: string[];
  requiredPreparation: string[];
  suggestedAttendees: string[];
  suggestedDurationMinutes: number;
};

export type AnalysisWarning = {
  code: string;
  message: string;
  nodeName?: string;
};

export type AgentRunSummary = {
  nodeName: string;
  status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "FALLBACK";
  durationMs?: number;
  requestedModel?: string;
  actualModel?: string;
  promptTokens?: number;
  completionTokens?: number;
  reasoningTokens?: number;
  retryCount: number;
};

export type MeetingAnalysis = {
  analysisRunId: string;
  meetingId: string;
  summary: MeetingSummary;
  decisions: Decision[];
  actionItems: ActionItem[];
  risksAndBlockers: RiskOrBlocker[];
  openQuestions: OpenQuestion[];
  followUp: FollowUpDraft;
  nextAgenda: NextAgenda;
  warnings: AnalysisWarning[];
  agentRuns: AgentRunSummary[];
  generatedAt: string;
};

