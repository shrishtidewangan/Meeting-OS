// import { Router } from "express";
// import { notImplementedHandler } from "../controllers/auth.controller";

// export const authRouter = Router();

// authRouter.post("/register", notImplementedHandler("register user"));
// authRouter.post("/login", notImplementedHandler("login user"));
// authRouter.get("/me", notImplementedHandler("get current user"));

import { Router } from "express";
import { register, login, me } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", requireAuth, me);