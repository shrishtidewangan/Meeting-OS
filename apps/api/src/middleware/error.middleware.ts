import type { ErrorRequestHandler } from "express";

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  const message = err instanceof Error ? err.message : "Unexpected error";

  res.status(500).json({
    ok: false,
    error: {
      code: "INTERNAL_ERROR",
      message
    }
  });
};

