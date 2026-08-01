<!-- # Known Limitations

Document known gaps honestly.

Include:

- Product limitations.
- Technical limitations.
- AI reliability limitations.
- Testing gaps.
- Security or privacy assumptions.
- What you would improve with two additional days.

TODO: replace this scaffold with your final limitations.
 -->

# Known Limitations

## Product Limitations

- Next-meeting agenda editing in the Review Workspace is local-only —
  there is no backend endpoint to persist edits to an already-finalized
  agenda, so edits there are for copying/reference, not saved back to
  the database. The same is true for follow-up email edits (a "Copy to
  clipboard" button is provided instead).
- The retry endpoint (POST .../analysis/:analysisRunId/retry) creates a
  brand-new analysis run rather than resuming the original failed run's
  checkpoint, since a run that never reached human review (FAILED) or
  failed a core node (PARTIAL_FAILURE) has no reliable paused state to
  resume from. The original failed run is preserved as a historical
  record, not deleted or overwritten.
- Customer interview, sales call, and team stand-up meeting types share
  the exact same six agent prompts and schemas as project meetings —
  the spec allows this ("may share the same data structure with prompt
  or emphasis changes") but no type-specific prompt tuning was done;
  project meeting is the only path that was extensively tested.

## Technical Limitations

- MemorySaver (LangGraph's in-memory checkpointer) is used, per the
  spec's explicit allowance for prototypes. Any in-progress or paused
  (NEEDS_REVIEW / PARTIAL_FAILURE) analysis run's checkpoint is lost if
  the API server restarts — resume would fail with an unknown-thread
  error after a restart. A durable, database-backed checkpointer is a
  stretch goal, not implemented here.
- AI_MAX_CONCURRENCY is listed in the required env vars but is never
  actually read or enforced anywhere in the codebase — nothing currently
  runs enough concurrent model calls to need throttling, but this means
  the variable is currently a no-op if set.

## AI Reliability Limitations

- Across 4 live OpenRouter evaluation runs (documented in full in
  docs/OPENROUTER_EVALUATION.md), core node timeouts were the dominant
  reliability issue. Raising AI_REQUEST_TIMEOUT_MS from 30000ms to
  60000ms substantially improved this (the reasoning-model configuration
  went from never completing all four core nodes to completing 4/4 in
  the final run), but openrouter/free's actionAgent still occasionally
  times out even at 60s.
- Token usage metadata (promptTokens/completionTokens/reasoningTokens)
  is not returned consistently by every free-tier provider that
  openrouter/free's dynamic routing selects — some models return it,
  others (e.g. Cohere, Ling models observed during testing) do not, even
  on successful calls. This is a provider-side inconsistency, not a bug
  in the extraction code, which correctly returns undefined rather than
  crashing when metadata is absent.
- One confirmed real date hallucination was observed in live testing
  (actionAgent inferred an incorrect specific date from "tomorrow" in
  one run) — this is exactly the class of error the human-review step
  exists to catch before finalization, but it means the raw AI output
  should never be treated as reliable without review, which is the
  product's entire design premise.

## Testing Gaps

- The full meeting-creation -> analysis -> review -> resume flow is
  covered by one committed Playwright end-to-end test using mock mode;
  a second, more granular multi-step live-OpenRouter version of this
  flow does not exist as an automated test (correctly, per spec: "Tests
  must not call OpenRouter").
- The retry endpoint is manually verified (tested against a real FAILED
  run, confirmed it creates a new successful run and correctly rejects
  retrying a non-failed run) but does not have a dedicated committed
  automated test file.
- ESLint is configured with 0 errors across the codebase, but 27
  warnings remain (all @typescript-eslint/no-explicit-any, concentrated
  in LangGraph's loosely-typed invoke() return values and a few flexible
  partial-update service methods) — a deliberate, disclosed tradeoff
  rather than a hidden gap.

## Security Or Privacy Assumptions

- Sanitized logging (logInfo/sanitizeMetadata) is wired into all six
  graph nodes, the analysis service, and the OpenRouter client, and was
  confirmed by reading real console output from a live run — no
  transcript, prompt, or API key content appeared. This relies on every
  future logInfo() call site continuing to pass only safe fields
  explicitly; sanitizeMetadata's blocklist (stripping "transcript",
  "apiKey", "prompt", "reasoning" keys) is a second layer of defense,
  not the only one.
- JWT is stored in localStorage on the frontend, not an httpOnly cookie
  — acceptable for this prototype, but a production version would want
  to move to cookie-based storage to reduce XSS exposure of the token.

## What I Would Improve With Two More Days

- Fix openrouter/free's remaining actionAgent timeout (likely needs a
  simplified action-extraction schema/prompt, since it consistently
  produces the largest completion payloads of any core node).
- Persist Next Agenda and Follow-Up edits back to the meeting record via
  a small new endpoint, rather than leaving them local-only.
- Add a durable (MongoDB-backed) LangGraph checkpointer so paused runs
  survive a server restart — currently the single biggest gap between
  this prototype and something closer to production-ready.
- Add dedicated automated tests for the retry endpoint and a live
  (mocked) version of the malformed-output-retry path specifically,
  beyond the partial-failure test that currently exists.