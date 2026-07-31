// export function createCheckpointer() {
//   throw new Error("TODO: implement MemorySaver or durable checkpointer in your branch");
// }

import { MemorySaver } from "@langchain/langgraph";

// MemorySaver keeps checkpoints in this process's memory only.
// KNOWN LIMITATION (per spec section 12): if the API server restarts,
// every in-progress or paused (NEEDS_REVIEW) analysis run's checkpoint is
// lost — resume will fail with an unknown-thread error after a restart.
// A durable checkpointer (e.g. backed by MongoDB) would be needed for
// production use; acceptable for this prototype per the spec's explicit
// allowance ("MemorySaver is acceptable for local prototype work").
export function createCheckpointer() {
  return new MemorySaver();
}