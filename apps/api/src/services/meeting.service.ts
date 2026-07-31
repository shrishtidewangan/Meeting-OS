// export class MeetingService {
//   createMeeting() {
//     throw new Error("TODO: implement meeting creation in your branch");
//   }
// }

import mongoose from "mongoose";
import { MeetingRepository } from "../repositories/meeting.repository";

const meetingRepository = new MeetingRepository();

// Converts a Mongoose ValidationError into a single clear message
function toReadableError(err: unknown): Error {
  if (err instanceof mongoose.Error.ValidationError) {
    const firstMessage = Object.values(err.errors)[0]?.message ?? "Validation failed";
    return new Error(firstMessage);
  }
  if (err instanceof Error) {
    return err;
  }
  return new Error("Unexpected error");
}

// Application-level checks matching spec section 9's exact rules
function validateMeetingInput(input: any, { partial = false } = {}) {
  if (!partial || input.title !== undefined) {
    if (!input.title || input.title.length < 3 || input.title.length > 120) {
      throw new Error("Title must be between 3 and 120 characters");
    }
  }

  if (!partial || input.transcript !== undefined) {
    const transcript = input.transcript;
    if (!transcript || transcript.length < 200) {
      throw new Error("Transcript too short (minimum 200 characters)");
    }
    if (transcript.length > 60000) {
      throw new Error("Transcript too long (maximum 60000 characters)");
    }
  }

  if (!partial || input.meetingType !== undefined) {
    if (!input.meetingType) {
      throw new Error("Meeting type is required");
    }
  }

  if (!partial || input.meetingDate !== undefined) {
    if (!input.meetingDate || isNaN(Date.parse(input.meetingDate))) {
      throw new Error("Meeting date must be a valid date");
    }
  }

  if (input.participants !== undefined && input.participants.length > 30) {
    throw new Error("Participants list cannot exceed 30 names");
  }

  if (input.projectOrAccountName !== undefined && input.projectOrAccountName.length > 120) {
    throw new Error("Project or account name must be at most 120 characters");
  }

  if (input.context !== undefined && input.context.length > 2000) {
    throw new Error("Context must be at most 2000 characters");
  }

  if (input.desiredOutcome !== undefined && input.desiredOutcome.length > 1000) {
    throw new Error("Desired outcome must be at most 1000 characters");
  }
}

// Fetches a meeting by id and distinguishes "doesn't exist" (404) from
// "exists but belongs to someone else" (403).
async function findOwnedOrThrow(meetingId: string, ownerId: string) {
  if (!mongoose.isValidObjectId(meetingId)) {
    throw new Error("Meeting not found");
  }

  const meeting = await meetingRepository.findById(meetingId);
  if (!meeting) {
    throw new Error("Meeting not found");
  }

  if (meeting.ownerId.toString() !== ownerId) {
    throw new Error("Forbidden: you do not have access to this meeting");
  }

  return meeting;
}

export class MeetingService {
  async createMeeting(ownerId: string, input: any) {
    validateMeetingInput(input);

    try {
      return await meetingRepository.create({ ...input, ownerId });
    } catch (err) {
      throw toReadableError(err);
    }
  }

  async listMeetings(ownerId: string) {
    return meetingRepository.findAllByOwner(ownerId);
  }

  async getMeeting(ownerId: string, meetingId: string) {
    return findOwnedOrThrow(meetingId, ownerId);
  }

  async updateMeeting(ownerId: string, meetingId: string, updates: any) {
    const meeting = await findOwnedOrThrow(meetingId, ownerId);

    validateMeetingInput(updates, { partial: true });

    Object.assign(meeting, updates);

    try {
      await meeting.save();
    } catch (err) {
      throw toReadableError(err);
    }

    return meeting;
  }

  async deleteMeeting(ownerId: string, meetingId: string) {
    const meeting = await findOwnedOrThrow(meetingId, ownerId);
    await meeting.deleteOne();
    return meeting;
  }

  async saveTranscript(ownerId: string, meetingId: string, transcript: string) {
    validateMeetingInput({ transcript }, { partial: true });
    return this.updateMeeting(ownerId, meetingId, { transcript });
  }
}