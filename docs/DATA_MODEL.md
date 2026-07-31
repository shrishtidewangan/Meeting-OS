# Data Model

Document your MongoDB/Mongoose data model here.

Include:

## User Model

Collection: `users`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Auto-generated |
| `name` | String | Required, 1-120 characters |
| `email` | String | Required, unique, lowercased before save |
| `passwordHash` | String | Required. Bcrypt hash (10 salt rounds). `select: false` — never returned by default queries; must be explicitly selected with `.select("+passwordHash")` (used only during login). Also stripped via a `toJSON` transform as a second safeguard, so it never appears in any API response even if selected. |
| `createdAt` | Date | Auto-managed (timestamps) |
| `updatedAt` | Date | Auto-managed (timestamps) |

**Indexes:** `email` (unique)

**Ownership:** Users own their own account only; there is no admin/shared access to other users' records.

---

## Meeting Model

Collection: `meetings`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Auto-generated |
| `ownerId` | ObjectId (ref: `User`) | Required, indexed. Identifies the owning user for all ownership checks. |
| `title` | String | Required, 3-120 characters |
| `meetingType` | String (enum) | Required. One of: `PROJECT`, `CUSTOMER_INTERVIEW`, `SALES_CALL`, `TEAM_STANDUP` |
| `meetingDate` | Date | Required, must be a valid date |
| `participants` | Array of `{ name: String }` | Optional, max 30 entries |
| `projectOrAccountName` | String | Optional, max 120 characters |
| `context` | String | Optional, max 2000 characters |
| `desiredOutcome` | String | Optional, max 1000 characters |
| `transcript` | String | Required, 200-60,000 characters. Can be set via pasted text (JSON body) or `.txt`/`.md` file upload (max 200KB). |
| `status` | String (enum) | One of: `DRAFT`, `QUEUED`, `RUNNING`, `PARTIAL_FAILURE`, `NEEDS_REVIEW`, `FINALIZED`, `FAILED`. Defaults to `DRAFT`. |
| `createdAt` | Date | Auto-managed (timestamps) |
| `updatedAt` | Date | Auto-managed (timestamps) |

- Analysis run model.

## Analysis Run Model

Collection: `analysisruns`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Auto-generated. This value is also embedded as `analysisRunId` inside the stored `result` object, so both always match. |
| `ownerId` | ObjectId (ref: `User`) | Required, indexed. The user who owns the underlying meeting. |
| `meetingId` | ObjectId (ref: `Meeting`) | Required, indexed. |
| `threadId` | String | Required. A UUID identifying the LangGraph execution thread (currently unused in mock mode, but required by the schema now so the real graph work doesn't need a migration later). |
| `status` | String (enum) | One of: `QUEUED`, `RUNNING`, `NEEDS_REVIEW`, `PARTIAL_FAILURE`, `FINALIZED`, `FAILED`. Defaults to `QUEUED`. |
| `requestedModel` | String | e.g. `"mock"` in mock mode; will hold the requested OpenRouter model string once live mode exists. |
| `actualModel` | String (optional) | The model that actually produced the result, if different from requested (e.g. after a fallback). |
| `warnings` | Array of `{ code, message, nodeName? }` | Structured warnings surfaced from the run (e.g. partial-failure scenarios). |
| `sanitizedErrors` | Array of String | Provider/graph errors with sensitive details stripped, safe to show to the user. |
| `retryCount` | Number | Defaults to 0. Not yet incremented anywhere (no retry logic implemented — see Known Limitations). |
| `result` | Mixed | The full `MeetingAnalysis` object (summary, decisions, action items, risks/blockers, open questions, follow-up, next agenda, warnings, agent runs). Stored as `Mixed` since its exact shape is owned by the shared `@meetingos/contracts` package, not duplicated here. |
| `startedAt` | Date | Required. |
| `completedAt` | Date (optional) | Set once the run finishes (always set immediately in mock mode, since there's no real async processing yet). |
| `createdAt` | Date | Auto-managed (timestamps) |
| `updatedAt` | Date | Auto-managed (timestamps) |

**Indexes:** `ownerId`, `meetingId`

**Ownership rules:**
- Every analysis run lookup checks `ownerId` against the authenticated user's ID.
- A run that doesn't exist (or has an invalid ObjectId format) returns `404 ANALYSIS_NOT_FOUND`.
- The meeting-scoped route (`GET /api/meetings/:meetingId/analysis/:analysisRunId`) additionally requires the run's `meetingId` to match the URL's `meetingId`.

**Mock mode behavior:**
- In mock mode (`AI_MODE=mock`), `result` is loaded directly from a static fixture file in `packages/test-fixtures/mock-results/` (one of `success`, `partial-failure`, `timeout`, `malformed-output`), then stamped with a fresh `analysisRunId`, `meetingId`, and `generatedAt` before being stored.
- No real model calls occur; `requestedModel`/`actualModel` are both hardcoded to `"mock"`.
- Starting a new analysis on the same meeting creates a new `AnalysisRun` document each time — there's no dedupe or "latest run" concept yet at the database level (the frontend tracks the current run via the URL's `runId` query parameter instead).

## Indexes

| Collection | Index | Purpose |
|---|---|---|
| users | email (unique) | Enforces one account per email at the database level, backing up the application-level duplicate check |
| meetings | ownerId | Fast lookup of "all meetings belonging to this user" (used by the dashboard and list endpoint) |
| analysisruns | ownerId | Fast lookup of "all runs belonging to this user" (used by the metrics endpoint) |
| analysisruns | meetingId | Fast lookup of "all runs for this meeting" |

## Ownership Rules

Every protected resource (meetings, transcripts, analysis runs, metrics)
is scoped to the authenticated user via `ownerId`, taken from the JWT,
never from the request body or URL.

- **Meetings**: a meeting that doesn't exist returns 404 MEETING_NOT_FOUND;
  a meeting that exists but belongs to another user returns 403
  MEETING_FORBIDDEN. This distinction is deliberate — it matches the
  literal "Forbidden cross-user access" wording from the spec, at the
  cost of confirming to a non-owner that a given id exists (a reasonable
  tradeoff, documented as a known design choice).
- **Analysis runs**: same 404/403 split, checked via a compound query
  requiring the run's `_id`, `meetingId`, AND `ownerId` to all match
  together — a run cannot be fetched or resumed by anyone other than the
  owner of both the run and its parent meeting.
- **Metrics**: not scoped to a single meeting; instead scoped to "all
  runs where ownerId = the authenticated user," so one user's metrics
  summary never includes another user's data.
- **Resume**: additionally checks the run's current status (must be
  NEEDS_REVIEW or PARTIAL_FAILURE) before allowing the state transition,
  independent of ownership — an owner cannot resume a run that's already
  FINALIZED or still RUNNING.

## Transcript Storage Behavior

- Stored as plain text directly on the `Meeting` document (`transcript`
  field) — no separate collection, no file storage on disk.
- Length is validated at three layers: the API's manual validation
  (precise error messages), the Mongoose schema's minlength/maxlength
  (database-level backup), and — once analysis starts — the graph's own
  `validateInput` node, which independently re-validates against the
  same `meetingInputSchema` (defense in depth, since the graph could in
  principle be invoked outside the HTTP layer, e.g. in tests).
- File uploads (`.txt`/`.md`) are read into memory and converted to a
  UTF-8 string before the same validation applies — never written to disk.
- Transcript content is deliberately excluded from all application
  logs. `observability/logger.ts`'s `sanitizeMetadata()` strips a
  `transcript` key from any logged metadata object as a blocklist
  safeguard, and in practice, none of the actual `logInfo()` calls in the
  codebase (graph nodes, analysis service, OpenRouter client) ever pass
  transcript content in the first place — confirmed by inspecting real
  console output during live testing.

## Sanitized Metrics Storage

Metrics are **not stored as a separate persisted collection** — they are
computed on demand from the existing `analysisruns` collection each time
`GET /api/metrics/analysis-runs` is called (an aggregation over that
user's own runs). This avoids a second copy of run data that could drift
out of sync with the source of truth.

What the metrics response deliberately excludes, even though the
underlying `AnalysisRun` documents contain it:
- The full `result` field (the entire `MeetingAnalysis`, which could
  contain transcript-derived evidence excerpts) — metrics only surface
  `status`, `requestedModel`, `actualModel`, `warningCount` (a count,
  not the warning text itself), and timing fields.
- Raw provider error messages — `sanitizedErrors` exists on the model for
  this reason, distinct from any raw error text a provider might return.
- Anything from another user's runs — the aggregation query is always
  scoped by `ownerId` before any computation happens.


