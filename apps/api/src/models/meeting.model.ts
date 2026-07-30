// export type MeetingModelStub = {
//   id: string;
//   userId: string;
//   title: string;
//   status: string;
// };

// TODO: replace with a Mongoose schema in your branch.

import { Schema, model, Document, Types } from "mongoose";
import { meetingTypes, meetingStatuses, type MeetingType, type MeetingStatus } from "@meetingos/contracts";

export interface IParticipant {
  name: string;
}

export interface IMeeting extends Document {
  ownerId: Types.ObjectId;
  title: string;
  meetingType: MeetingType;
  meetingDate: Date;
  participants: IParticipant[];
  projectOrAccountName?: string;
  context?: string;
  desiredOutcome?: string;
  transcript: string;
  status: MeetingStatus;

  // Populated once analysis is implemented (spec section 18) — left
  // unstructured (Mixed) for now since the exact shape lands with the
  // LangGraph work; not required for the Day 1 meeting CRUD slice.
  latestGeneratedDraft?: unknown;
  latestReviewedRecord?: unknown;
  followUpEmail?: unknown;
  nextAgenda?: unknown;

  createdAt: Date;
  updatedAt: Date;
}

const participantSchema = new Schema<IParticipant>(
  { name: { type: String, required: true, trim: true } },
  { _id: false }
);

const meetingSchema = new Schema<IMeeting>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [120, "Title must be at most 120 characters"],
    },
    meetingType: { type: String, enum: meetingTypes, required: true },
    meetingDate: { type: Date, required: true },
    participants: {
      type: [participantSchema],
      default: [],
      validate: {
        validator: (arr: IParticipant[]) => arr.length <= 30,
        message: "Participants list cannot exceed 30 names",
      },
    },
    projectOrAccountName: {
      type: String,
      trim: true,
      maxlength: [120, "Project or account name must be at most 120 characters"],
    },
    context: {
      type: String,
      maxlength: [2000, "Context must be at most 2000 characters"],
    },
    desiredOutcome: {
      type: String,
      maxlength: [1000, "Desired outcome must be at most 1000 characters"],
    },
    transcript: {
      type: String,
      required: true,
      minlength: [200, "Transcript must be at least 200 characters"],
      maxlength: [60000, "Transcript must be at most 60000 characters"],
    },
    status: {
      type: String,
      enum: meetingStatuses,
      default: "DRAFT",
    },
    latestGeneratedDraft: { type: Schema.Types.Mixed },
    latestReviewedRecord: { type: Schema.Types.Mixed },
    followUpEmail: { type: Schema.Types.Mixed },
    nextAgenda: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Meeting = model<IMeeting>("Meeting", meetingSchema);
