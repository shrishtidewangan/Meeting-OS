import type { RequestHandler } from "express";
import { createNotImplementedHandler } from "./notImplemented";

export function notImplementedHandler(feature: string): RequestHandler {
  return createNotImplementedHandler(`Metrics TODO: ${feature}`);
}

