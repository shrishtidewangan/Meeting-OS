// import type { RequestHandler } from "express";
// import { createNotImplementedHandler } from "./notImplemented";

// export function notImplementedHandler(feature: string): RequestHandler {
//   return createNotImplementedHandler(`Meeting TODO: ${feature}`);
// }

import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { MeetingService } from "../services/meeting.service";

const meetingService = new MeetingService();

function handleError(err: unknown, res: Response) {
  if (err instanceof Error) {
    if (err.message === "Meeting not found") {
      return res.status(404).json({
        ok: false,
        error: { code: "MEETING_NOT_FOUND", message: err.message },
      });
    }
    if (err.message.startsWith("Forbidden")) {
      return res.status(403).json({
        ok: false,
        error: { code: "MEETING_FORBIDDEN", message: err.message },
      });
    }
    return res.status(400).json({
      ok: false,
      error: { code: "MEETING_REQUEST_INVALID", message: err.message },
    });
  }
  return res.status(500).json({
    ok: false,
    error: { code: "INTERNAL_ERROR", message: "Unexpected error" },
  });
}

export const meetingController = {
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const meeting = await meetingService.createMeeting(req.userId!, req.body);
      res.status(201).json({ ok: true, meeting });
    } catch (err) {
      handleError(err, res);
    }
  },

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const meetings = await meetingService.listMeetings(req.userId!);
      res.status(200).json({ ok: true, meetings });
    } catch (err) {
      handleError(err, res);
    }
  },

  async getOne(req: AuthenticatedRequest, res: Response) {
    try {
      const meeting = await meetingService.getMeeting(req.userId!, req.params.meetingId);
      res.status(200).json({ ok: true, meeting });
    } catch (err) {
      handleError(err, res);
    }
  },

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const meeting = await meetingService.updateMeeting(req.userId!, req.params.meetingId, req.body);
      res.status(200).json({ ok: true, meeting });
    } catch (err) {
      handleError(err, res);
    }
  },

  async remove(req: AuthenticatedRequest, res: Response) {
    try {
      await meetingService.deleteMeeting(req.userId!, req.params.meetingId);
      res.status(200).json({ ok: true, deleted: true });
    } catch (err) {
      handleError(err, res);
    }
  },

  // Accepts EITHER a pasted transcript (JSON body: { transcript }) OR an
  // uploaded .txt/.md file (multipart field "file") — the upload.single
  // middleware in meeting.routes.ts populates req.file when a file is sent.
  async saveTranscript(req: AuthenticatedRequest, res: Response) {
  try {
    const file = (req as any).file as { buffer: Buffer } | undefined;
    const transcript = file ? file.buffer.toString("utf-8") : req.body.transcript;

    const meeting = await meetingService.saveTranscript(
      req.userId!,
      req.params.meetingId,
      transcript
    );
    res.status(200).json({ ok: true, meeting });
  } catch (err) {
    handleError(err, res);
  }
},
};