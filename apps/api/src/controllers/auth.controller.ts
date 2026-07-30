// import type { RequestHandler } from "express";
// import { createNotImplementedHandler } from "./notImplemented";

// export function notImplementedHandler(feature: string): RequestHandler {
//   return createNotImplementedHandler(`Auth TODO: ${feature}`);
// }

import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

const authService = new AuthService();

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;
    const { user, token } = await authService.register(name, email, password);
    res.status(201).json({ ok: true, user, token });
  } catch (err) {
    if (err instanceof Error) {
      return res.status(409).json({ ok: false, error: { code: "REGISTER_FAILED", message: err.message } });
    }
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.login(email, password);
    res.status(200).json({ ok: true, user, token });
  } catch (err) {
    if (err instanceof Error) {
      return res.status(401).json({ ok: false, error: { code: "LOGIN_FAILED", message: err.message } });
    }
    next(err);
  }
};

export const me = async (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({ ok: true, userId: req.userId });
};
