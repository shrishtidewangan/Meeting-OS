// export async function createMeeting() {
//   throw new Error("TODO: implement createMeeting in your branch");
// }

// export async function listMeetings() {
//   throw new Error("TODO: implement listMeetings in your branch");
// }

// export async function saveTranscript() {
//   throw new Error("TODO: implement saveTranscript in your branch");
// }

import { apiClient } from "./apiClient";
import type { MeetingInput, MeetingType, MeetingStatus, Participant } from "@meetingos/contracts";

export type Meeting = {
  _id: string;
  ownerId: string;
  title: string;
  meetingType: MeetingType;
  meetingDate: string;
  participants: Participant[];
  projectOrAccountName?: string;
  context?: string;
  desiredOutcome?: string;
  transcript: string;
  status: MeetingStatus;
  followUpEmail?: { subject: string; body: string };
  nextAgenda?: {
    title: string;
    objectives: string[];
    items: string[];
    requiredPreparation: string[];
    suggestedAttendees: string[];
    suggestedDurationMinutes: number;
  };
  createdAt: string;
  updatedAt: string;
};

export async function createMeeting(input: MeetingInput) {
  const res = await apiClient.post<{ ok: true; meeting: Meeting }>("/api/meetings", input);
  return res.meeting;
}

export async function listMeetings() {
  const res = await apiClient.get<{ ok: true; meetings: Meeting[] }>("/api/meetings");
  return res.meetings;
}

export async function getMeeting(meetingId: string) {
  const res = await apiClient.get<{ ok: true; meeting: Meeting }>(`/api/meetings/${meetingId}`);
  return res.meeting;
}

export async function saveTranscript(meetingId: string, transcript: string) {
  const res = await apiClient.post<{ ok: true; meeting: Meeting }>(
    `/api/meetings/${meetingId}/transcript`,
    { transcript }
  );
  return res.meeting;
}

export async function deleteMeeting(meetingId: string) {
  return apiClient.delete<{ ok: true; deleted: true }>(`/api/meetings/${meetingId}`);
}
