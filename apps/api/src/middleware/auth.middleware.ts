import type { RequestHandler } from "express";

export const requireAuth: RequestHandler = (_req, res) => {
  res.status(501).json({
    ok: false,
    error: {
      code: "AUTH_NOT_IMPLEMENTED",
      message: "TODO: implement JWT authentication and ownership checks in your branch"
    }
  });
};

