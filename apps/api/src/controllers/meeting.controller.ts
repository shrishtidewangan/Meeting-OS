import type { RequestHandler } from "express";
import { createNotImplementedHandler } from "./notImplemented";

export function notImplementedHandler(feature: string): RequestHandler {
  return createNotImplementedHandler(`Meeting TODO: ${feature}`);
}

