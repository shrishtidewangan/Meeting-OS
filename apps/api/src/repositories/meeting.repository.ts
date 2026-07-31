// export class MeetingRepository {
//   findOwnedMeeting() {
//     throw new Error("TODO: implement owned meeting lookup in your branch");
//   }
// }

import { Meeting, IMeeting } from "../models/meeting.model";

export class MeetingRepository {
  create(data: Partial<IMeeting>) {
    return Meeting.create(data);
  }

  findAllByOwner(ownerId: string) {
    return Meeting.find({ ownerId }).sort({ createdAt: -1 });
  }

  // Finds by id ALONE, regardless of owner. The service layer compares
  // ownerId itself afterward, so it can distinguish "doesn't exist" (404)
  // from "exists but belongs to someone else" (403) — a plain owner-filtered
  // query can't tell those two cases apart.
  findById(meetingId: string) {
    return Meeting.findById(meetingId);
  }

  // Convenience lookup matching the original stub's method name — filters
  // by owner directly. Returns null for both "doesn't exist" and "wrong
  // owner" cases, so it's only used where that distinction doesn't matter.
  findOwnedMeeting(ownerId: string, meetingId: string) {
    return Meeting.findOne({ _id: meetingId, ownerId });
  }
}