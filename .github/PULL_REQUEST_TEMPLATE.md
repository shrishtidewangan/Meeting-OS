# MeetingOS Submission

## Summary

MeetingOS turns a pasted meeting transcript into a reviewed, editable
project record. The complete implemented workflow:

Sign in or register -> Create a meeting -> Paste or upload a transcript
-> Select meeting type -> Start LangGraph analysis -> View per-node
progress on the Analysis Progress page (four core agents running in
parallel) -> Review the generated draft in an editable Review
Workspace (edit the summary, decisions, action items, risks/blockers,
open questions; add/remove decisions and action items; confirm or
correct inferred owners and dates) -> Resume the graph with reviewed
data -> Follow-Up and Planning agents generate an email and next-
meeting agenda from the REVIEWED data, not the AI's original draft ->
Record finalizes and appears on the dashboard with its follow-up email
and agenda attached, viewable from the meeting details page.

Every protected resource (meetings, transcripts, analysis runs,
metrics) enforces per-user ownership: a resource that doesn't exist
returns 404, a resource that exists but belongs to another user
returns 403 — verified with a real second user via committed Supertest
tests, not just manually.

## Demo Evidence

Full end-to-end flow verified in-browser covering the
complete path: sign in -> dashboard -> create meeting (including real
fixture file upload) -> meeting details (DRAFT) -> Run Analysis ->
Analysis Progress page showing all four core agents SUCCEEDED with
Follow-Up/Planning correctly PENDING pre-resume -> Review Workspace
across all 7 tabs, editable fields shown mid-edit -> Confirm & Resume
-> FINALIZED status with real Follow-Up and Next Agenda content ->
dashboard reflecting the finalized record. See attached screenshots
for the full sequence. Video walkthrough: [https://www.loom.com/share/7fe4b0e2319f406d8d66fd5ca6357066].

## LangGraph

**State shape:** `MeetingGraphState`, defined via LangGraph's
`Annotation.Root`. Holds input fields (transcript, meetingType,
participants, meetingDate), per-agent output fields with concatenating
reducers for anything multiple parallel nodes write to simultaneously
(decisions, actionItems, risksAndBlockers, openQuestions, warnings,
agentRuns — needed because 3+ core agents can all fail/succeed at the
same instant and would otherwise silently overwrite each other's
entries), a `coreDraft` field (the Zod-validated core output before
human review), a `reviewedRecord` field (populated only after resume),
and a `finalRecord` field (the finalized, Zod-validated
MeetingAnalysis).

**Nodes:** `validateInput`, `prepareContext`, the six required agent
nodes (Summary, Decision, Action, Risk, Follow-Up, Planning),
`validateCoreOutputs`, `aggregateCoreDraft`, `humanReview` (the
interrupt), `finalizeRecord`. Each of the six agent nodes is built via
a factory function (e.g. `createSummaryNode(modelClient)`) so the exact
same node code runs against either the mock or live OpenRouter client
interchangeably — the node itself has no knowledge of which one it's
using.

**Edges:** `START -> validateInput -> prepareContext`, then a fan-out
to the four core extraction nodes, fanning back in at
`validateCoreOutputs -> aggregateCoreDraft -> humanReview`. After the
interrupt, a second fan-out to Follow-Up and Planning, fanning back in
at `finalizeRecord -> END`.

**Parallel core extraction:** Summary, Decision, Action, and Risk all
connect from the same starting node and to the same next node — this
shared topology is what LangGraph reads to run them concurrently; no
explicit `Promise.all` was written. Proven, not just assumed: a single
`graph.invoke()` call returns all four `agentRuns` entries at once,
each with independent timing, and total elapsed time consistently
matched the slowest individual agent rather than the sum of all four.

**Human-review interrupt:** `humanReviewNode` calls LangGraph's
`interrupt()`, which freezes execution mid-function and persists the
graph's exact position and full state to a checkpointer (`MemorySaver`
— documented limitation: in-memory, lost on server restart), keyed by
`thread_id`.

**Resume with same thread ID:** `POST
/api/meetings/:meetingId/analysis/:analysisRunId/resume` resumes with
`new Command({ resume: reviewedRecord })` against the run's original
`threadId`. One real architectural bug found and fixed along the way:
the compiled graph was originally being recreated fresh on every
request, meaning each request got its own empty `MemorySaver` with no
memory of any prior pause — resume could never find anything. Fixed by
making the compiled graph a single shared module-level instance for
the whole server process. Proven end-to-end: the `followUp`/
`nextAgenda` fields on the analysis result genuinely do not exist
anywhere until after this resume call succeeds — verified by checking
a `NEEDS_REVIEW` run's result (no `followUp` key at all) versus the
same run's result after resume (key now present with real content).

**Partial-failure handling:** each node's try/catch is fully
independent — one node's failure returns a warning and a `FAILED`
status for itself only, never an uncaught exception that could crash
sibling nodes' work. Verified two ways: a committed deterministic unit
test that simulates `actionAgent` failing while three siblings succeed
(their output stays fully intact in the resulting core draft), and a
real live OpenRouter run where this exact scenario happened
organically (actionAgent genuinely timed out while the other three
core agents succeeded in the same run).

## OpenRouter

**Mock mode:** `MockMeetingModelClient` returns deterministic,
schema-valid canned output per node, zero real network calls. This is
what all automated tests use; `AI_MODE=mock` requires no API key.

**Live OpenRouter mode:** `OpenRouterMeetingModelClient` implements the
same `MeetingModelClient` interface as the mock client — no graph node
anywhere imports an OpenRouter SDK or knows OpenRouter exists; only
this one adapter class does. Uses `withStructuredOutput(schema, {
includeRaw: true })` to access both the parsed output and token/model
metadata (confirmed necessary through direct testing — without this
flag, no metadata is returned at all). Retries once on validation
failure, feeding the actual Zod error message back into the retry
prompt rather than blindly retrying the same request. Local Zod
re-validation happens even though OpenRouter's own structured-output
feature already validates server-side — deliberate defense-in-depth,
since `openrouter/free` routes to different underlying models each
call with varying reliability.

**`openrouter/free` smoke test:** run against the real project-meeting
fixture through the full graph. Confirmed the router dynamically
selects different underlying providers per call (observed 4 different
actual models across 4 nodes in a single run).

**Reasoning-capable free-model comparison:** `openrouter/free` vs
`nvidia/nemotron-3-ultra-550b-a55b:free`, run 4 times total against the
real fixture. Documented honestly in `docs/OPENROUTER_EVALUATION.md`,
including a real problem found and fixed mid-evaluation: early runs
showed neither configuration completing all four core nodes — some
successful calls were taking 25-29 seconds against a 30-second
timeout. Raised `AI_REQUEST_TIMEOUT_MS` to 60000 based on that observed
data and re-ran; the reasoning model completed 4/4 nodes for the first
time. One earlier draft of this evaluation also contained an incorrect
hallucination claim (an owner attribution flagged as wrong that turned
out, on checking the actual fixture transcript, to be correct) — this
was caught and corrected rather than left standing.

**Requested and actual model tracking:** every `AnalysisRun.agentRuns`
entry records both `requestedModel` and `actualModel` (when available),
visible via the Run Details tab in the UI and the metrics endpoint
(`GET /api/metrics/analysis-runs`).

## Tests

Commands run, in order, on a fresh full verification pass:

    pnpm typecheck
    Result: PASS — all 5 typechecked workspace projects, zero errors

    pnpm lint
    Result: PASS — 0 errors across all 4 linted packages, 28 warnings
    (all @typescript-eslint/no-explicit-any, documented and disclosed
    as a deliberate tradeoff in docs/TEST_RESULTS.md)

    pnpm test
    Result: PASS — 4 test files, 16 tests total (1 contracts test, 13
    validation schema tests, 2 web tests including the required
    frontend review interaction, and API tests including 9 Supertest
    integration tests plus 4 LangGraph contract tests covering
    parallel execution, partial node failure, input validation, and
    full pause+resume)

    pnpm build
    Result: PASS — all 5 buildable packages succeeded, real Tailwind
    CSS output confirmed in the production bundle

    pnpm test:e2e
    Result: PASS — 2 Playwright tests: login->dashboard, and the full
    happy path (login -> create meeting -> Analysis Progress page ->
    Review Workspace -> edit -> resume -> FINALIZED with real
    follow-up content)

Full details and exact output in docs/TEST_RESULTS.md.

## Checklist

- [x] The PR describes the complete workflow (above)
- [x] Setup steps tested — README.md rewritten with real, verified
      setup instructions (not the original assignment packet content)
- [x] No `.env` or secrets committed — verified by running
      `scripts/check-no-secrets.ps1`, which passed
- [x] No paid model configured by default — `AI_MODE=mock` is the
      default in `.env.example`
- [x] Mock mode works without OpenRouter — confirmed, this is what
      every automated test uses
- [x] Live mode uses OpenRouter — confirmed via 4 real live evaluation
      runs
- [x] LangGraph state, nodes, edges, interrupt, and resume explained
      above with specific implementation and verification details
- [x] Ownership checks are tested — 9 Supertest tests including 404 vs
      403 with a second real user
- [x] Model output is validated locally — Zod schemas validate every
      node's output regardless of provider-side structured-output
      support
- [x] Partial failure is demonstrated — both a committed automated
      test and real live evidence
- [x] All claimed checks were actually run — see docs/TEST_RESULTS.md
      for verbatim output of every command
- [x] Known failures are disclosed — see docs/KNOWN_LIMITATIONS.md;
      includes the actionAgent live-timeout reliability issue, the
      MemorySaver restart limitation, and local-only Next
      Agenda/Follow-Up edits
- [x] Raw reasoning traces, transcripts, tokens, prompts, and API keys
      are not exposed — sanitized logging confirmed by reading real
      console output from a live run showing zero leakage of any of
      these

## AI-Assisted Coding Disclosure

I used Claude extensively throughout this project's implementation —
essentially all of the code in this repository was written iteratively
with AI assistance, describing what I needed and reviewing/testing the
output before moving forward, rather than accepting suggestions
without verification.

One specific suggestion I corrected: an early draft of the OpenRouter
evaluation claimed the reasoning-capable model had hallucinated an
owner name ("Jordan") on a blocker, based on a general expectation
about typical model errors rather than checking the actual source. I
pushed back and had this verified against the real fixture transcript,
which showed Jordan was the literal speaker of that exact line — the
"hallucination" claim was wrong and had to be corrected in the
documentation rather than left standing as an unverified assumption.

