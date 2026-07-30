# Work Log

Use this file to record your implementation decisions, blockers, tests, and AI-assisted development notes.

## Setup Notes

- Starter commit SHA: 75692e8
- Branch name: intern/shrishti-dewangan/meetingos-prototype
- Local setup result: Cloned repo, installed dependencies via pnpm. Verified scaffold successfully (typecheck, tests, and lint all passing). Configured local MongoDB (mongodb://localhost:27017/meetingos) and confirmed AI_MODE=mock. Frontend running on localhost:5173 and backend on localhost:3001, health check returns {"ok":true}

## Daily Notes

### Day 1

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
- What blocked me:
- What I tested:

### Day 3

- What I implemented:
- What blocked me:
- What I tested:

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

