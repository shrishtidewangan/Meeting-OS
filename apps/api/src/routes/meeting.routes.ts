// import { Router } from "express";
// import { notImplementedHandler } from "../controllers/meeting.controller";

// export const meetingRouter = Router();

// meetingRouter.post("/", notImplementedHandler("create meeting"));
// meetingRouter.get("/", notImplementedHandler("list owned meetings"));
// meetingRouter.get("/:meetingId", notImplementedHandler("get owned meeting"));
// meetingRouter.patch("/:meetingId", notImplementedHandler("update owned meeting"));
// meetingRouter.delete("/:meetingId", notImplementedHandler("delete owned meeting"));
// meetingRouter.post("/:meetingId/transcript", notImplementedHandler("save transcript"));
// meetingRouter.post("/:meetingId/analysis", notImplementedHandler("start analysis"));
// meetingRouter.get("/:meetingId/analysis/:analysisRunId", notImplementedHandler("get analysis status"));
// meetingRouter.post("/:meetingId/analysis/:analysisRunId/resume", notImplementedHandler("resume analysis"));
// meetingRouter.post("/:meetingId/analysis/:analysisRunId/retry", notImplementedHandler("retry analysis"));

import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import multer, { MulterError } from "multer";
import path from "node:path";
import { meetingController } from "../controllers/meeting.controller";
import { analysisController } from "../controllers/analysis.controller";
import { createNotImplementedHandler } from "../controllers/notImplemented";
import { requireAuth } from "../middleware/auth.middleware";

export const meetingRouter = Router();

// Every meeting route requires a logged-in user
meetingRouter.use(requireAuth);

// --- File upload setup for the transcript endpoint (spec section 9) ---
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 }, // 200KB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".txt" && ext !== ".md") {
      return cb(new Error("UNSUPPORTED_FILE_TYPE"));
    }
    cb(null, true);
  },
});

function handleTranscriptUpload(req: Request, res: Response, next: NextFunction) {
  upload.single("file")(req, res, (err: unknown) => {
    if (!err) return next();

    if (err instanceof MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        ok: false,
        error: { code: "FILE_TOO_LARGE", message: "Uploaded file exceeds the 200KB limit" },
      });
    }
    if (err instanceof Error && err.message === "UNSUPPORTED_FILE_TYPE") {
      return res.status(400).json({
        ok: false,
        error: { code: "UNSUPPORTED_FILE_TYPE", message: "Only .txt and .md files are supported" },
      });
    }
    return res.status(400).json({
      ok: false,
      error: { code: "UPLOAD_FAILED", message: err instanceof Error ? err.message : "Upload failed" },
    });
  });
}

meetingRouter.post("/", meetingController.create);
meetingRouter.get("/", meetingController.list);
meetingRouter.get("/:meetingId", meetingController.getOne);
meetingRouter.patch("/:meetingId", meetingController.update);
meetingRouter.delete("/:meetingId", meetingController.remove);
meetingRouter.post("/:meetingId/transcript", handleTranscriptUpload, meetingController.saveTranscript);

// Mock analysis endpoints — now implemented (real LangGraph is a later step)
meetingRouter.post("/:meetingId/analysis", analysisController.start);
meetingRouter.get("/:meetingId/analysis/:analysisRunId", analysisController.getForMeeting);

// Resume/retry require the LangGraph human-review interrupt — still out of scope
meetingRouter.post(
  "/:meetingId/analysis/:analysisRunId/resume",
  createNotImplementedHandler("resume analysis")
);
meetingRouter.post(
  "/:meetingId/analysis/:analysisRunId/retry",
  createNotImplementedHandler("retry analysis")
);