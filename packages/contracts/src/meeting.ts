export const meetingTypes = ["PROJECT", "CUSTOMER_INTERVIEW", "SALES_CALL", "TEAM_STANDUP"] as const;
export type MeetingType = (typeof meetingTypes)[number];
export const meetingStatuses = [
  "DRAFT",
  "QUEUED",
  "RUNNING",
  "PARTIAL_FAILURE",
  "NEEDS_REVIEW",
  "FINALIZED",
  "FAILED"
] as const;
export type MeetingStatus = (typeof meetingStatuses)[number];
export type Participant = {
  name: string;
};
export type MeetingInput = {
  title: string;
  meetingType: MeetingType;
  meetingDate: string;
  participants?: Participant[];
  projectOrAccountName?: string;
  context?: string;
  desiredOutcome?: string;
  transcript: string;
};
