# API Summary

## Error Envelope Shape

All error responses follow this shape:
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}

## Auth Endpoints

### POST /api/auth/register
Creates a new user account and returns a JWT.

Request:
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "name": "Test User Four",
  "email": "test4@example.com",
  "password": "password123"
}

Success response (201):
{
  "ok": true,
  "user": {
    "name": "Test User Four",
    "email": "test4@example.com",
    "_id": "6a6a96d009fee9340e361323",
    "createdAt": "2026-07-30T00:12:00.224Z",
    "updatedAt": "2026-07-30T00:12:00.224Z"
  },
  "token": "eyJhbGciOi..."
}

Error response — duplicate email (409):
{
  "ok": false,
  "error": {
    "code": "REGISTER_FAILED",
    "message": "An account with this email already exists"
  }
}

Notes:
- Password is hashed with bcrypt before storage; passwordHash is never
  returned in any response.
- Token is signed with JWT_SECRET, includes { userId }, expires in 1 day,
  and carries an issuer claim (JWT_ISSUER) validated on every protected request.

### POST /api/auth/login
Authenticates an existing user and returns a JWT.

Request:
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "test4@example.com",
  "password": "password123"
}

Success response (200):
{
  "ok": true,
  "user": {
    "_id": "6a6a96d009fee9340e361323",
    "name": "Test User Four",
    "email": "test4@example.com",
    "createdAt": "2026-07-30T00:12:00.224Z",
    "updatedAt": "2026-07-30T00:12:00.224Z"
  },
  "token": "eyJhbGciOi..."
}

Error response — wrong password (401):
{
  "ok": false,
  "error": {
    "code": "LOGIN_FAILED",
    "message": "Invalid email or password"
  }
}

Note: the same error and message are returned whether the password is
wrong or the email doesn't exist at all — this is intentional, to avoid
revealing which accounts are registered.

### GET /api/auth/me
Returns the currently authenticated user's ID. Requires a valid JWT.

Request:
GET http://localhost:3001/api/auth/me
Authorization: Bearer <token>

Success response (200):
{ "ok": true, "userId": "6a6a96d009fee9340e361323" }

Error responses:
- 401 AUTH_MISSING_TOKEN — no Authorization header, or not in "Bearer <token>" form
- 401 AUTH_INVALID_TOKEN — token invalid, expired, or issuer mismatch

## Meeting Endpoints

All meeting endpoints require authentication:
  Authorization: Bearer <token>

### POST /api/meetings
Creates a new meeting owned by the authenticated user.

Request body:
{
  "title": "Sprint Planning",
  "meetingType": "PROJECT",
  "meetingDate": "2026-07-29",
  "transcript": "Full transcript text, 200-60000 characters...",
  "participants": [{ "name": "Ana" }],
  "projectOrAccountName": "Acme Corp",
  "context": "Optional background",
  "desiredOutcome": "Optional goal"
}

meetingType must be one of: PROJECT, CUSTOMER_INTERVIEW, SALES_CALL, TEAM_STANDUP

Success response (201):
{
  "ok": true,
  "meeting": {
    "_id": "...",
    "ownerId": "...",
    "title": "Sprint Planning",
    "meetingType": "PROJECT",
    "meetingDate": "2026-07-29T00:00:00.000Z",
    "transcript": "...",
    "status": "DRAFT",
    "participants": [],
    "createdAt": "...",
    "updatedAt": "..."
  }
}

Error responses (400 MEETING_REQUEST_INVALID):
- "Title must be between 3 and 120 characters"
- "Transcript too short (minimum 200 characters)"
- "Transcript too long (maximum 60000 characters)"
- "Meeting type is required"
- "Meeting date must be a valid date"
- "Participants list cannot exceed 30 names"
- "Project or account name must be at most 120 characters"
- "Context must be at most 2000 characters"
- "Desired outcome must be at most 1000 characters"

### GET /api/meetings
Lists all meetings owned by the authenticated user, newest first.

Success response (200):
{ "ok": true, "meetings": [ { ...meeting }, { ...meeting } ] }

### GET /api/meetings/:meetingId
Gets one meeting, only if owned by the authenticated user.

Success response (200):
{ "ok": true, "meeting": { ... } }

Error responses:
- 404 MEETING_NOT_FOUND — meetingId doesn't exist
- 403 MEETING_FORBIDDEN — meetingId exists but belongs to another user

### PATCH /api/meetings/:meetingId
Updates one or more fields on an owned meeting. All fields optional;
whichever fields are present are validated with the same rules as create.

Request body (any subset of create fields):
{ "title": "Sprint Planning (Updated)" }

Success response (200):
{ "ok": true, "meeting": { ...updated meeting } }

Error responses: same 404/403 as GET, plus 400 MEETING_REQUEST_INVALID
for any invalid field present in the update.

### DELETE /api/meetings/:meetingId
Deletes an owned meeting.

Success response (200):
{ "ok": true, "deleted": true }

Error responses: same 404/403 as GET.

### POST /api/meetings/:meetingId/transcript
Overwrites the transcript on an owned meeting. Accepts EITHER:

  a) JSON body:
     { "transcript": "New transcript text, 200-60000 characters..." }

  b) multipart/form-data upload:
     field name: "file"
     accepted extensions: .txt, .md
     max file size: 200KB

Success response (200):
{ "ok": true, "meeting": { ...meeting with updated transcript } }

Error responses:
- 404 MEETING_NOT_FOUND / 403 MEETING_FORBIDDEN — same as GET
- 400 MEETING_REQUEST_INVALID — transcript too short/long after extraction
- 400 UNSUPPORTED_FILE_TYPE — uploaded file isn't .txt or .md
- 400 FILE_TOO_LARGE — uploaded file exceeds 200KB
- 400 UPLOAD_FAILED — other upload error

## Analysis Endpoints

All analysis endpoints require authentication:
  Authorization: Bearer <token>

Two modes are supported on the same start endpoint:
- **Fixture mode** (default): loads a static, pre-written result from
  packages/test-fixtures/mock-results/ — fast, deterministic, used for
  the Day-1 "one complete mock result" demonstration.
- **Real graph mode** (`useGraph: true`): actually invokes the full
  LangGraph pipeline (six agent nodes, parallel core extraction, human-
  review interrupt) using MockMeetingModelClient (AI_MODE=mock, no real
  API calls) or a live model client if manually configured. This is
  what the frontend's "Run Analysis" button actually calls.

### POST /api/meetings/:meetingId/analysis
Starts an analysis run for an owned meeting.

Request body (optional):
{ "scenario": "success" }
  — OR —
{ "useGraph": true }

scenario (fixture mode) must be one of: success, partial-failure,
timeout, malformed-output. Defaults to the MOCK_AI_SCENARIO env var
(default "success") if omitted and useGraph is not set.

useGraph: true runs the real LangGraph pipeline instead of loading a
fixture — this is the mode the actual UI uses.

Success response (201):
{
  "ok": true,
  "analysisRun": {
    "_id": "...",
    "ownerId": "...",
    "meetingId": "...",
    "threadId": "...",
    "status": "NEEDS_REVIEW",
    "requestedModel": "mock",
    "actualModel": "mock",
    "warnings": [],
    "sanitizedErrors": [],
    "agentRuns": [ { "nodeName": "summaryAgent", "status": "SUCCEEDED", "durationMs": 0, "requestedModel": "mock", "actualModel": "mock", "retryCount": 0 } ],
    "retryCount": 0,
    "result": {
      "analysisRunId": "...",
      "meetingId": "...",
      "summary": { "executiveSummary": "...", "themes": ["..."], "outcome": "CLEAR_OUTCOME" },
      "decisions": [ { "id": "...", "statement": "...", "owner": null, "evidence": {...}, "confidence": 0.94, "inferred": false } ],
      "actionItems": [],
      "risksAndBlockers": [],
      "openQuestions": [],
      "followUp": { "subject": "...", "body": "..." },
      "nextAgenda": { "title": "...", "objectives": [], "items": [], "requiredPreparation": [], "suggestedAttendees": [], "suggestedDurationMinutes": 30 },
      "warnings": [],
      "agentRuns": [],
      "generatedAt": "..."
    },
    "startedAt": "...",
    "completedAt": "..."
  }
}

Scenario -> resulting status (fixture mode):
  success           -> NEEDS_REVIEW
  partial-failure   -> PARTIAL_FAILURE
  malformed-output   -> PARTIAL_FAILURE
  timeout           -> FAILED

In real graph mode (useGraph: true), status is NEEDS_REVIEW if the
graph reached the human-review interrupt (even with some core nodes
failed — see Failure Handling), or FAILED if the graph did not reach
the interrupt at all (e.g. even the Summary Agent failed).

The meeting's own `status` and `latestGeneratedDraft` are updated to match.

Error responses:
- 404 ANALYSIS_NOT_FOUND — meetingId doesn't exist
- 403 ANALYSIS_FORBIDDEN — meetingId exists but belongs to another user
- 400 ANALYSIS_REQUEST_INVALID — unknown scenario name

### GET /api/meetings/:meetingId/analysis/:analysisRunId
Fetches one analysis run, scoped to both the meeting and the owner.

Success response (200):
{ "ok": true, "analysisRun": { ...same shape as above } }

Error responses: same 404/403 as above, using code ANALYSIS_NOT_FOUND /
ANALYSIS_FORBIDDEN.

### GET /api/analysis/:analysisRunId
Same lookup as above, without needing the meetingId — a top-level
convenience route. Scoped to the owner only.

Success response (200):
{ "ok": true, "analysisRun": { ... } }

Error responses: same as above.

## Resume And Retry Endpoints

### POST /api/meetings/:meetingId/analysis/:analysisRunId/resume
Resumes a paused analysis run with the user's reviewed edits, running the
Follow-Up and Planning agents and finalizing the record. Requires
authentication and ownership of both the meeting and the run.

Request body:
{
  "reviewedRecord": {
    "summary": { "executiveSummary": "...", "themes": [...], "outcome": "CLEAR_OUTCOME" },
    "decisions": [ /* array of Decision, possibly edited/added/removed by the user */ ],
    "actionItems": [ /* array of ActionItem, possibly edited/added/removed */ ],
    "risksAndBlockers": [ /* array of RiskOrBlocker, possibly edited */ ],
    "openQuestions": [ /* array of OpenQuestion, possibly edited */ ]
  }
}

Preconditions:
- The run must currently have status NEEDS_REVIEW or PARTIAL_FAILURE.
  Attempting to resume a run in any other status (e.g. already FINALIZED,
  or still RUNNING) returns 400.
- reviewedRecord is validated against the same schema shape used for the
  core draft — malformed edits are rejected before the graph resumes.

What happens internally:
- The graph resumes using LangGraph's Command({ resume: reviewedRecord })
  mechanism, reusing the run's original threadId so it picks up exactly
  where it paused at the human-review interrupt.
- followUpAgent and planningAgent run using the REVIEWED data (not the
  original AI-generated draft) — this is enforced by finalizeRecordNode,
  which prefers state.reviewedRecord over the raw extraction when
  assembling the final record.
- The resulting MeetingAnalysis is Zod-validated (meetingAnalysisSchema)
  before being persisted.

Success response (200):
{
  "ok": true,
  "analysisRun": {
    "_id": "...",
    "status": "FINALIZED",
    "result": {
      /* full MeetingAnalysis, now including followUp and nextAgenda,
         which do not exist before resume */
    },
    ...
  }
}

Side effects on the Meeting record:
- meeting.status is set to FINALIZED
- meeting.latestReviewedRecord is set to the submitted reviewedRecord
- meeting.followUpEmail and meeting.nextAgenda are populated from the
  final record

Error responses:
- 404 ANALYSIS_NOT_FOUND — meeting or run doesn't exist
- 403 ANALYSIS_FORBIDDEN — meeting/run belongs to another user
- 400 ANALYSIS_REQUEST_INVALID — wrong run status for resume, or
  reviewedRecord failed schema validation

### POST /api/meetings/:meetingId/analysis/:analysisRunId/retry
Creates a fresh analysis run for a meeting whose previous run FAILED or
PARTIAL_FAILURE'd, rather than attempting to resume the broken run's
checkpoint (a run that never reached human review has no reliable
paused state to resume from). The original failed run is preserved as
a historical record, not deleted or modified.

Preconditions:
- The target run must currently have status FAILED or PARTIAL_FAILURE.
  Retrying a run in any other status (e.g. NEEDS_REVIEW, FINALIZED)
  returns 400.

Success response (201):
{
  "ok": true,
  "analysisRun": {
    "_id": "...",   /* a NEW, different id from the retried run */
    "status": "NEEDS_REVIEW",
    ...
  }
}

Error responses:
- 404 ANALYSIS_NOT_FOUND — meeting or run doesn't exist
- 403 ANALYSIS_FORBIDDEN — meeting/run belongs to another user
- 400 ANALYSIS_REQUEST_INVALID — run status doesn't allow retry

## Metrics Endpoints

### GET /api/metrics/analysis-runs
Returns aggregate statistics across all of the authenticated user's own
analysis runs. Requires authentication; not scoped to a specific meeting
(covers all of the user's meetings).

Success response (200):
{
  "ok": true,
  "metrics": {
    "totalRuns": 14,
    "byStatus": { "NEEDS_REVIEW": 11, "FINALIZED": 2, "FAILED": 1 },
    "byRequestedModel": { "mock": 14 },
    "totalRetries": 0,
    "totalWarnings": 0,
    "averageDurationMs": 27334,
    "recentRuns": [
      {
        "analysisRunId": "...",
        "meetingId": "...",
        "status": "FINALIZED",
        "requestedModel": "mock",
        "actualModel": "mock",
        "warningCount": 0,
        "startedAt": "...",
        "completedAt": "...",
        "durationMs": 41459
      }
      /* up to 10 most recent runs */
    ]
  }
}

Notes:
- averageDurationMs is computed only across runs that have a completedAt
  timestamp (still-paused NEEDS_REVIEW runs with no completedAt are
  excluded from the average, not counted as 0).
- recentRuns intentionally excludes transcript content, prompts, and raw
  provider error details — only public status/timing/model fields, per
  spec section 20 (no transcript/secret leakage in any application output).

Error responses:
- 401 AUTH_MISSING_TOKEN / AUTH_INVALID_TOKEN — same as any protected route