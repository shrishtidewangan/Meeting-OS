import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getEnv } from "../config/env";

const env = getEnv();

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      ok: false,
      error: { code: "AUTH_MISSING_TOKEN", message: "Missing or malformed Authorization header" },
    });
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      issuer: env.JWT_ISSUER,
    }) as { userId: string };

    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({
      ok: false,
      error: { code: "AUTH_INVALID_TOKEN", message: "Invalid or expired token" },
    });
  }
};