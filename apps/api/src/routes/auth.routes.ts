import { Router } from "express";
import { notImplementedHandler } from "../controllers/auth.controller";

export const authRouter = Router();

authRouter.post("/register", notImplementedHandler("register user"));
authRouter.post("/login", notImplementedHandler("login user"));
authRouter.get("/me", notImplementedHandler("get current user"));

