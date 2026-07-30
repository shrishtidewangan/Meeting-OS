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

- Indexes.
- Ownership rules.
- Transcript storage behavior.
- Sanitized metrics storage.

TODO: replace this scaffold with your data model documentation.

