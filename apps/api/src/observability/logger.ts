export function logInfo(message: string, metadata: Record<string, unknown> = {}) {
  console.info(message, sanitizeMetadata(metadata));
}

export function sanitizeMetadata(metadata: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(metadata).filter(([key]) => !["transcript", "apiKey", "prompt", "reasoning"].includes(key))
  );
}

