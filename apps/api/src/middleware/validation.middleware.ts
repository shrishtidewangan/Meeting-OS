import type { RequestHandler } from "express";

export function validateRequest(): RequestHandler {
  return (_req, res) => {
    res.status(501).json({
      ok: false,
      error: {
        code: "VALIDATION_NOT_IMPLEMENTED",
        message: "TODO: implement request validation middleware in your branch"
      }
    });
  };
}

