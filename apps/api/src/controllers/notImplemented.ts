import type { RequestHandler } from "express";

export function createNotImplementedHandler(feature: string): RequestHandler {
  return (_req, res) => {
    res.status(501).json({
      ok: false,
      error: {
        code: "NOT_IMPLEMENTED",
        message: feature
      }
    });
  };
}

