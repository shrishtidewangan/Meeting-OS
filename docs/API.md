# API Summary

Document your implemented REST API here.

Include:

- Auth endpoints.
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


- Meeting endpoints.

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

- Analysis endpoints.

## Analysis Endpoints

All analysis endpoints require authentication:
  Authorization: Bearer <token>

Currently implemented in **mock mode only** — these run against static
fixture data (packages/test-fixtures/mock-results/), not a real LangGraph
workflow or OpenRouter. Live analysis is a later step.

### POST /api/meetings/:meetingId/analysis
Starts a mock analysis run for an owned meeting.

Request body (optional):
{ "scenario": "success" }

scenario must be one of: success, partial-failure, timeout, malformed-output
Defaults to the MOCK_AI_SCENARIO env var (default "success") if omitted.

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

Scenario -> resulting status:
  success           -> NEEDS_REVIEW
  partial-failure   -> PARTIAL_FAILURE
  malformed-output   -> PARTIAL_FAILURE
  timeout           -> FAILED

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


- Resume and retry endpoints.
- Metrics endpoints.
- Request and response examples.
- Error envelope shape.

TODO: replace this scaffold with your API documentation.

