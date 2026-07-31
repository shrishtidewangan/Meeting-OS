# Work Log

Use this file to record your implementation decisions, blockers, tests, and AI-assisted development notes.

## Setup Notes

- Starter commit SHA: 75692e8
- Branch name: intern/shrishti-dewangan/meetingos-prototype
- Local setup result: Cloned repo, installed dependencies via pnpm. Verified scaffold successfully (typecheck, tests, and lint all passing). Configured local MongoDB (mongodb://localhost:27017/meetingos) and confirmed AI_MODE=mock. Frontend running on localhost:5173 and backend on localhost:3001, health check returns {"ok":true}


## Daily Notes

### Day 1

**What I implemented:**
- Registration and login (bcrypt password hashing, JWT issuing/verification with issuer claim)
- `requireAuth` middleware protecting all meeting/analysis routes
- Meeting API: create, list, get, update, delete — all scoped to the authenticated user
- Ownership enforcement distinguishing "not found" (404) from "forbidden, belongs to another user" (403)
- Transcript save endpoint supporting both pasted text (JSON) and `.txt`/`.md` file upload (multipart, via multer), with type and size validation
- Input validation matching spec section 9 exactly (title 3–120 chars, transcript 200–60,000 chars, participants ≤30, etc.), with precise error messages like "Transcript too short"
- Mock analysis service: loads real fixture files from `packages/test-fixtures/mock-results/`, maps each scenario to the correct run/meeting status, stores an `AnalysisRun` record
- Frontend: Auth page (register/login), Dashboard (search, type/status filters, empty state), New Meeting form (paste or upload, client-side validation, character count), Meeting Details page (transcript preview + trigger mock analysis), Review Workspace (all 8 required tabs rendering the full mock result with confidence badges and inferred-value tags)
- CORS enabled on the backend (was missing entirely — frontend couldn't have called the API at all without it)

**What blocked me:**
- `express-serve-static-core` types were missing/broken, which blocked a global `Request` type augmentation for `req.userId` — worked around by defining a local `AuthenticatedRequest` interface instead of augmenting the global namespace
- `dotenv.config()` wasn't loading `.env` at all initially, because the working directory when running via `pnpm --filter api dev` is `apps/api`, not the repo root — fixed by resolving the path explicitly
- Missing `mongoose.connect()` call at startup caused every DB query to hang for 10s and time out with a confusing error, rather than failing fast
- JWT signing initially had a mismatched `issuer` claim between register and login, causing freshly-registered tokens to fail verification
- The top-level `GET /api/analysis/:analysisRunId` route was missing `requireAuth` entirely in the original stub — caught this before it shipped
- A self-introduced bug: initially generated a separate UUID for `analysisRunId` instead of using the `AnalysisRun` document's own Mongo `_id`, which would have made every future lookup fail — caught and fixed before testing
- PowerShell's `curl` alias (`Invoke-WebRequest`) and quoting rules for JSON bodies caused repeated friction; settled on `Invoke-RestMethod` for JSON and `curl.exe -F` for multipart file uploads
- `-Form` isn't supported in Windows PowerShell 5.1 (only PowerShell 6+), so multipart upload testing had to go through `curl.exe` instead

**What I tested:**
- Full register → login → wrong password → duplicate email flow (both via API calls and through the actual browser UI)
- Full meeting CRUD, including a second registered user attempting cross-user access (confirmed 403 vs. a nonexistent id confirmed 404)
- Transcript save via both JSON paste and real file upload (`.txt` success, `.pdf` correctly rejected)
- Boundary cases: transcript too short, too long; title validation
- All four mock analysis scenarios (`success`, `partial-failure`, `timeout`, `malformed-output`) end-to-end, confirming correct status mapping
- Confirmed the previously-missing auth check on `/api/analysis/:analysisRunId` now correctly returns 401 with no token
- Full browser walkthrough: sign in → dashboard (real data) → new meeting (created via the form) → meeting details → run mock analysis → review workspace showing all 8 tabs with real fixture data (decisions, confidence %, evidence excerpts)

### Day 2

- What I implemented:
  - Zod contracts for every agent output slice (summary, decision, action,
    risk, follow-up, planning) plus the full MeetingAnalysis contract and
    a meeting-input schema, all in a shared @meetingos/validation package
  - Real LangGraph state (Annotation.Root) with concatenating reducers for
    fields multiple parallel nodes write to
  - All six agent nodes (Summary, Decision, Action, Risk, Follow-Up,
    Planning), each calling a MeetingModelClient interface and validating
    its own output slice with Zod before returning
  - validateInput and prepareContext as real graph stages, plus
    validateCoreOutputs and aggregateCoreDraft (the latter actually
    assembles and Zod-validates a coreDraft object, not a no-op)
  - The full StateGraph: parallel fan-out for the four core agents,
    fan-in, human-review interrupt, parallel fan-out again for
    Follow-Up/Planning after review
  - MockMeetingModelClient (deterministic, no live calls) and
    OpenRouterMeetingModelClient (real ChatOpenRouter integration with
    retry-on-validation-feedback)
  - Graph contract tests covering parallel execution, input validation,
    and — critically — a real resume test using Command({resume})

- What blocked me:
  - Repeatedly lost work because I pasted new file content into the wrong
    existing file instead of creating new ones, most seriously overwriting
    packages/contracts/src/{meeting,api,analysis}.ts with Zod schema
    content meant for a different package. Had to restore all three from
    scratch.
  - The exact runtime shape LangGraph returns when a graph pauses at
    interrupt() wasn't something I could verify from documentation alone —
    had to build a debug endpoint and inspect the real response before I
    could trust the __interrupt__/resume mechanics
  - @langchain/openrouter's actual TypeScript types didn't match what
    online docs (likely Python-package docs) described — ChatOpenRouter
    has no top-level `reasoning` constructor field; had to read the
    installed package's own .d.ts file to find the real answer
    (modelKwargs, an escape hatch for raw API body params)
  - withStructuredOutput() silently returns ONLY the parsed data with no
    token/model metadata unless you pass { includeRaw: true } — this
    wasn't obvious and required a live test call to discover

- What tested:
  - pnpm --filter api test — 3/3 graph tests passing (parallel execution,
    short-transcript rejection, full pause+resume with Command)
  - A live debug script confirming real OpenRouter token usage
    (promptTokens/completionTokens/reasoningTokens) and actualModel
    extraction against an actual API response, not assumed field names
  - Full browser walkthrough: create meeting -> run mock analysis via UI
    -> Analysis Progress page showing real per-node SUCCEEDED status with
    durations -> Review Workspace rendering real graph output across all
    8 tabs, including the graceful "not generated yet" state for
    Follow-Up/Next Agenda before resume

### Day 3

- What implemented:
  - Real analysis resume endpoint (POST .../analysis/:analysisRunId/resume),
    fixing an architectural bug along the way: startGraphAnalysis was
    creating a brand-new graph (and thus a fresh, empty MemorySaver) on
    every call, which would have made resume permanently unable to find
    any paused checkpoint. Fixed by using one shared, module-level graph
    instance for the whole server process.
  - finalizeRecordNode now builds and Zod-validates the actual final
    MeetingAnalysis record, using state.reviewedRecord (the user's edits)
    with precedence over the raw AI extraction — not the original output
  - Editable Review Workspace UI: users can edit every field on decisions,
    action items, risks/blockers, and open questions, add/remove
    decisions and action items, and editing an inferred owner/date clears
    its INFERRED tag. "Confirm & Resume" calls the real resume endpoint.
  - Retry-with-validation-feedback: OpenRouterMeetingModelClient now feeds
    the actual Zod error message back into the retry prompt, not just a
    blind retry
  - Analysis-run metrics endpoint (GET /api/metrics/analysis-runs):
    aggregate counts by status/model, retry/warning totals, average
    duration, and a sanitized recent-runs list — also fixed a second
    missing-auth bug on this route (same class of bug as the earlier
    /api/analysis/:id issue)
  - Sanitized structured logging (logInfo) wired into all six graph
    nodes, the analysis service, and the OpenRouter client
  - Live OpenRouter evaluation: ran the real project-meeting fixture
    twice through openrouter/free and once through a specific
    reasoning-capable free model (nvidia/nemotron-3-ultra-550b-a55b:free),
    verified every specific quality claim (owner attributions, dates)
    against the actual fixture transcript rather than assuming

- What blocked me:
  - The single biggest defect I caught in my own work: I initially wrote
    an OpenRouter evaluation claiming the reasoning model hallucinated an
    owner ("Jordan") on a blocker. When I actually went back and checked
    the fixture transcript, Jordan is the literal speaker of that line —
    the attribution was correct, and I had to rewrite that section of the
    evaluation rather than let an unverified claim stand
  - actionAgent times out (hits the full 30s limit) in 3 of 4 live
    evaluation runs, for both models — this is a real, still-open
    reliability problem, not something I've fixed yet
  - Token usage (promptTokens/completionTokens) only came back populated
    for NVIDIA Nemotron-family models during live testing; other free
    providers (Cohere, Ling) returned successful responses with no usage
    metadata at all — a provider-side inconsistency, not a bug in my code

- What tested:
  - Full resume flow tested twice: once via PowerShell/API directly
    (confirming followUp/nextAgenda literally do not exist until after
    resume), and once through the actual browser UI end-to-end — start
    analysis, edit a decision's owner in the Review Workspace, click
    Confirm & Resume, watch it auto-switch to the Follow-Up tab with real
    generated content and status FINALIZED
  - Metrics endpoint tested against 14 real accumulated analysis runs
    from the session, confirming correct byStatus/byRequestedModel
    aggregation and a real 401 when called with no token
  - Sanitized logging confirmed by actually reading real console output
    from a live analysis run — verified no transcript, prompt, or API key
    text appeared anywhere in the log lines

### Day 4

- What I implemented:
- What blocked me:
- What I tested:

## Required Reflection

1. What did you implement first, and why?
- I implemented registration and login first, since every other endpoint in
the system depends on having an authenticated user to scope data to.
Meetings, transcripts, and analysis runs all need an ownerId, and
ownership checks (returning 404/403 correctly) only make sense once
there's a real user and a working JWT to verify.

Starting here also let me establish patterns I reused for the rest of
the backend: bcrypt for password hashing, a consistent error-response
shape, and a requireAuth middleware that every subsequent route
(meetings, analysis) could just plug into rather than reimplementing
auth logic per feature. Getting this foundation right first — including
fixing early issues like the missing mongoose.connect() call and the
JWT issuer mismatch — meant the meeting API and analysis API could be
built and tested against a stable, working auth layer instead of
debugging auth and business logic simultaneously.

2. Which part of the graph was hardest?
3. Where did you use AI coding assistance?
4. What AI-generated code or recommendation did you reject or correct?
5. Which test gives the strongest evidence that the prototype works?
6. What is the most serious current limitation?
7. What would you build with two more days?

