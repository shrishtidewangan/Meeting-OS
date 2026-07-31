// export class AnalysisRunRepository {
//   findByMeeting() {
//     throw new Error("TODO: implement analysis run persistence in your branch");
//   }
// }

import { AnalysisRun, IAnalysisRun } from "../models/analysisRun.model";

export class AnalysisRunRepository {
  create(data: Partial<IAnalysisRun>) {
    return AnalysisRun.create(data);
  }

  findById(analysisRunId: string, ownerId: string) {
    return AnalysisRun.findOne({ _id: analysisRunId, ownerId });
  }

  findByIdAndMeeting(analysisRunId: string, meetingId: string, ownerId: string) {
    return AnalysisRun.findOne({ _id: analysisRunId, meetingId, ownerId });
  }

  // Matches the original stub's method name — lists every run for a meeting.
  findByMeeting(meetingId: string, ownerId: string) {
    return AnalysisRun.find({ meetingId, ownerId }).sort({ createdAt: -1 });
  }

  findAllByOwner(ownerId: string) {
    return AnalysisRun.find({ ownerId }).sort({ createdAt: -1 });
  }
}