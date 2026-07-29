# MeetingOS Product And Engineering Spec

**Project:** Agentic Meeting Product Manager and Follow-Up System  
**Codename:** MeetingOS  
**Duration:** 3 to 4 working days  
**Assignment type:** Individual full-stack prototype  
**Required AI provider:** OpenRouter free model access  
**Required workflow framework:** LangGraph.js

## 1. Overview

MeetingOS converts meeting notes or transcripts into an editable project record.

A user creates a meeting, selects a meeting type, adds transcript content, and starts an AI analysis. A LangGraph workflow coordinates specialized agents that produce a structured draft. The user reviews that draft, edits it, and resumes the graph. The system then creates a follow-up email, creates a next-meeting agenda, and saves the completed meeting record.

The core workflow:

```text
Create meeting
-> Add transcript or notes
-> Select meeting type
-> Run LangGraph analysis
-> Review structured draft
-> Edit tasks, owners, decisions, questions, risks, and dates
-> Resume graph with reviewed record
-> Generate follow-up email
-> Generate next-meeting agenda
-> Save completed project record
```

The AI suggests. The user confirms.

## 2. Product Principle

MeetingOS should not pretend model output is automatically correct.

Every important extracted item should show evidence and confidence. Inferred owners and dates must be visible as inferred until the user confirms or edits them.

## 3. User Problem

After meetings, teams often lose clarity because:

- Notes are incomplete.
- Decisions are mixed with suggestions.
- Action items lack owners or deadlines.
- Risks and blockers are not captured.
- Follow-up emails take extra time.
- The next meeting starts without a clear agenda.

MeetingOS turns the conversation into a reviewable project record.

## 4. Required Scope

Build the required prototype with:

- Authentication.
- Meeting dashboard.
- New meeting form.
- Transcript paste or text upload.
- Four meeting types.
- LangGraph analysis workflow.
- Six agent nodes.
- Zod-validated structured output.
- Human-review interrupt and resume.
- Editable review workspace.
- Follow-up email generation.
- Next-meeting agenda generation.
- MongoDB persistence.
- Mock AI mode.
- OpenRouter live mode.
- Error handling and partial recovery.
- Tests and documentation.

## 5. Non-Goals

Do not build:

- Live video or audio conferencing.
- Real-time transcription.
- Calendar synchronization.
- Automatic email sending.
- Slack, ClickUp, Jira, Linear, or GitHub task creation.
- Billing.
- Production compliance certification.
- Fully autonomous follow-up agents.
- Processing confidential production meetings.
- General-purpose autonomous agent tooling.

External actions may be future integrations, but they are not part of this prototype.

## 6. User Role

Only one user role is required:

| Role | Permissions |
|---|---|
| Member | Create meetings, run analysis, edit generated records, generate follow-up content, view and delete their own meetings |

Every protected resource must enforce ownership.

## 7. Meeting Types

Support:

| Meeting type | Focus |
|---|---|
| Project meeting | Decisions, tasks, owners, deadlines, blockers, next agenda |
| Customer interview | Pain points, user language, insights, follow-up questions |
| Sales call | Needs, objections, buying signals, commitments |
| Team stand-up | Completed work, current work, blockers, dependencies |

All meeting types should return the same top-level response structure. Project meeting mode is the main demo and test path.

## 8. Required Screens

### Sign In Or Register

- Register.
- Sign in.
- Show validation and authentication errors.

### Dashboard

- Recent meetings.
- Status badge.
- Meeting type.
- Date.
- Participant count.
- Open action-item count.
- Search by title.
- Filter by meeting type or status.
- Empty state.
- New meeting button.

### New Meeting

- Title.
- Date.
- Meeting type.
- Participant names.
- Optional project or account name.
- Optional context.
- Transcript paste area.
- `.txt` or `.md` upload.
- Character count.
- Analyze button.
- Validation feedback.

### Analysis Progress

- Overall run status.
- Agent status list.
- Elapsed time.
- Partial failure warnings.
- Retry failed section action where implemented.

### Review Workspace

Include sections or tabs for:

- Overview.
- Decisions.
- Action items.
- Risks and blockers.
- Open questions.
- Follow-up.
- Next agenda.
- Run details.

The user must be able to edit the generated draft before finalization.

### Meeting Details

- Finalized record.
- Copy actions.
- Edit or reopen action where supported.
- Analysis metadata.
- Delete action with confirmation.

## 9. Input Requirements

Required fields:

| Field | Rule |
|---|---|
| Title | 3 to 120 characters |
| Meeting type | One supported enum value |
| Meeting date | Valid date |
| Transcript or notes | 200 to 60,000 characters |

Optional fields:

| Field | Rule |
|---|---|
| Participants | Up to 30 names |
| Project or account name | Up to 120 characters |
| Context | Up to 2,000 characters |
| Desired outcome | Up to 1,000 characters |

Supported upload formats:

- `.txt`
- `.md`

The server must reject unsupported file types and oversized content.

## 10. Meeting Statuses

Use deterministic statuses:

```ts
type MeetingStatus =
  | "DRAFT"
  | "QUEUED"
  | "RUNNING"
  | "PARTIAL_FAILURE"
  | "NEEDS_REVIEW"
  | "FINALIZED"
  | "FAILED";
```

Expected flow:

```text
DRAFT
-> QUEUED
-> RUNNING
-> NEEDS_REVIEW
-> FINALIZED
```

Failure paths:

```text
RUNNING -> PARTIAL_FAILURE -> NEEDS_REVIEW
QUEUED or RUNNING -> FAILED
```

## 11. Evidence And Confidence

Every decision, action item, risk, blocker, and open question should include:

- Evidence excerpt or source reference.
- Confidence value from `0` to `1`.
- Inference flag where relevant.

The UI must distinguish:

- Explicitly stated information.
- Inferred suggestions.
- Missing or unknown information.

Do not silently convert inferred owners or deadlines into confirmed facts.

## 12. LangGraph Architecture

MeetingOS must use a controlled LangGraph workflow.

Required logical graph:

```text
START
-> validateInput
-> prepareContext
-> summaryAgent
-> decisionAgent
-> actionAgent
-> riskAgent
-> validateCoreOutputs
-> aggregateCoreDraft
-> humanReview interrupt
-> resume with reviewed record
-> followUpAgent
-> planningAgent
-> finalizeRecord
-> END
```

The four core extraction nodes should run in parallel where practical:

```text
prepareContext
  -> summaryAgent  \
  -> decisionAgent  \
  -> actionAgent     -> validateCoreOutputs
  -> riskAgent      /
```

Follow-Up and Planning run after human review.

### Checkpoint Requirement

- Compile the graph with a checkpointer.
- `MemorySaver` is acceptable for local prototype work.
- Document that in-memory checkpoints are lost after server restart.
- Store public run status and public output in MongoDB.

### Interrupt Requirement

After the core draft is assembled, the graph must pause for review.

When resuming:

- Use the same thread ID.
- Pass the reviewed record through the LangGraph resume mechanism.
- Use reviewed values for follow-up and agenda generation.

## 13. Agent Requirements

### Summary Agent

Outputs:

- Executive summary.
- Main themes.
- Outcome status: `CLEAR_OUTCOME`, `PARTIAL_OUTCOME`, or `NO_CLEAR_OUTCOME`.

Rules:

- Do not invent agreements.
- Prefer specific outcomes over chronological narration.
- Keep summary concise.

### Decision Agent

Outputs each decision with:

- Statement.
- Owner if explicit.
- Evidence.
- Confidence.
- Inferred flag.

Rules:

- Exclude proposals, brainstorming, and unresolved options.
- Ambiguous items should become open questions, not decisions.

### Action Agent

Outputs each action item with:

- Title.
- Description.
- Owner or `null`.
- Due date or `null`.
- Status.
- Dependencies.
- Evidence.
- Confidence.
- Owner-inferred flag.
- Due-date-inferred flag.
- User-confirmed flag.

Rules:

- Use `null` for unknown owners and dates.
- Resolve relative dates only when unambiguous.
- Do not invent exact dates from vague language.

### Risk Agent

Outputs each item with:

- Type: `RISK` or `BLOCKER`.
- Description.
- Impact: `LOW`, `MEDIUM`, or `HIGH`.
- Suggested mitigation.
- Suggested owner.
- Evidence.
- Confidence.

Rules:

- Separate current blockers from future risks.
- Do not exaggerate low-impact concerns.

### Follow-Up Agent

Outputs:

- Suggested subject.
- Email body.

Rules:

- Use reviewed data when available.
- Do not introduce new commitments.
- Clearly list owners and dates.
- Keep the default draft concise.

### Planning Agent

Outputs:

- Agenda title.
- Objectives.
- Agenda items.
- Required preparation.
- Suggested attendees.
- Suggested duration.

Rules:

- Prioritize unresolved questions, blockers, and upcoming commitments.
- Avoid repeating completed discussion without a reason.

## 14. Structured Output Contracts

Top-level analysis:

```ts
interface MeetingAnalysis {
  analysisRunId: string;
  meetingId: string;
  summary: MeetingSummary;
  decisions: Decision[];
  actionItems: ActionItem[];
  risksAndBlockers: RiskOrBlocker[];
  openQuestions: OpenQuestion[];
  followUp: FollowUpDraft;
  nextAgenda: NextAgenda;
  warnings: AnalysisWarning[];
  agentRuns: AgentRunSummary[];
  generatedAt: string;
}
```

Evidence:

```ts
interface EvidenceReference {
  excerpt: string;
  sourceType: "TRANSCRIPT" | "USER_CONTEXT" | "INFERENCE";
  startOffset?: number;
  endOffset?: number;
}
```

Decision:

```ts
interface Decision {
  id: string;
  statement: string;
  owner: string | null;
  evidence: EvidenceReference;
  confidence: number;
  inferred: boolean;
}
```

Action item:

```ts
interface ActionItem {
  id: string;
  title: string;
  description: string | null;
  owner: string | null;
  dueDate: string | null;
  status: "OPEN" | "IN_PROGRESS" | "DONE";
  dependencies: string[];
  evidence: EvidenceReference;
  confidence: number;
  ownerInferred: boolean;
  dueDateInferred: boolean;
  confirmedByUser: boolean;
}
```

Risk or blocker:

```ts
interface RiskOrBlocker {
  id: string;
  type: "RISK" | "BLOCKER";
  description: string;
  impact: "LOW" | "MEDIUM" | "HIGH";
  mitigation: string | null;
  owner: string | null;
  evidence: EvidenceReference;
  confidence: number;
}
```

## 15. OpenRouter Strategy

OpenRouter is the required live provider.

Use:

- `AI_MODE=mock` for tests and deterministic local development.
- `openrouter/free` for smoke testing.
- One currently available reasoning-capable `:free` model for comparison.

Provider-specific code must live behind an adapter.

The graph should call a generic model client interface, not OpenRouter directly.

## 16. Required Environment Variables

```env
NODE_ENV=development
WEB_ORIGIN=http://localhost:5173
API_PORT=3001

MONGODB_URI=mongodb://localhost:27017/meetingos

JWT_SECRET=replace-with-development-secret
JWT_ISSUER=meetingos-api
JWT_EXPIRES_IN=8h

AI_MODE=mock
MOCK_AI_SCENARIO=success
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openrouter/free
OPENROUTER_REASONING_MODEL=
OPENROUTER_REASONING_EFFORT=medium
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
PROMPT_VERSION=meetingos-v1
AI_REQUEST_TIMEOUT_MS=30000
AI_MAX_RETRIES=1
AI_MAX_CONCURRENCY=4
```

No real secrets may be committed.

## 17. Recommended Repository Structure

```text
meetingos/
|-- README.md
|-- WORK_LOG.md
|-- .env.example
|-- package.json
|-- pnpm-workspace.yaml
|-- docs/
|   |-- ARCHITECTURE.md
|   |-- API.md
|   |-- AGENTS.md
|   |-- DATA_MODEL.md
|   |-- TEST_RESULTS.md
|   |-- OPENROUTER_EVALUATION.md
|   `-- KNOWN_LIMITATIONS.md
|-- apps/
|   |-- web/
|   |   `-- src/
|   |       |-- components/
|   |       |-- features/
|   |       |-- pages/
|   |       |-- services/
|   |       `-- test/
|   `-- api/
|       `-- src/
|           |-- routes/
|           |-- controllers/
|           |-- services/
|           |-- repositories/
|           |-- models/
|           |-- middleware/
|           |-- graph/
|           |   |-- nodes/
|           |   |-- prompts/
|           |   |-- schemas/
|           |   `-- checkpointer.ts
|           |-- model-client/
|           |-- observability/
|           |-- config/
|           `-- test/
|-- packages/
|   |-- contracts/
|   |-- validation/
|   `-- test-fixtures/
`-- tests/
    `-- e2e/
```

## 18. Data Model

Persist at least these entities.

### User

- ID.
- Email.
- Password hash.
- Created date.
- Updated date.

### Meeting

- ID.
- User ID.
- Title.
- Meeting type.
- Meeting date.
- Participants.
- Project or account name.
- Context.
- Transcript.
- Status.
- Latest generated draft.
- Latest reviewed record.
- Follow-up email.
- Next agenda.
- Created date.
- Updated date.

### Analysis Run

- ID.
- Meeting ID.
- User ID.
- Graph thread ID.
- Status.
- Node statuses.
- Started date.
- Completed date.
- Requested model.
- Actual model when available.
- Warnings.
- Sanitized errors.
- Retry count.
- Latency and token metadata when available.

## 19. REST API

Minimum endpoints:

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

POST   /api/meetings
GET    /api/meetings
GET    /api/meetings/:meetingId
PATCH  /api/meetings/:meetingId
DELETE /api/meetings/:meetingId

POST   /api/meetings/:meetingId/transcript
POST   /api/meetings/:meetingId/analysis
GET    /api/meetings/:meetingId/analysis/:analysisRunId
POST   /api/meetings/:meetingId/analysis/:analysisRunId/resume
POST   /api/meetings/:meetingId/analysis/:analysisRunId/retry

GET    /api/metrics/analysis-runs
```

Use a consistent response envelope for success and errors.

## 20. Security And Privacy

Required:

- Password hashing.
- JWT validation.
- Ownership checks on every protected route.
- Input validation on every external input.
- Output validation on every model result.
- No API keys in logs.
- No raw reasoning traces in storage or logs.
- No transcript text in ordinary logs or analytics labels.
- Sanitized provider errors returned to clients.

## 21. Error Handling

Handle:

- Invalid input.
- Unauthorized request.
- Forbidden cross-user access.
- Unsupported file type.
- Transcript too short.
- Transcript too long.
- OpenRouter timeout.
- OpenRouter rate limit.
- Invalid model output.
- Zod validation failure.
- Partial graph failure.
- Resume with wrong or missing thread ID.

One failed specialist should not destroy all successful outputs.

## 22. Testing Strategy

Include:

- Unit tests for schemas and utility logic.
- API integration tests for auth, meetings, ownership, and analysis routes.
- Graph tests for state transitions, parallel nodes, retry, partial failure, interrupt, and resume.
- Frontend tests for creation, review, inferred value editing, and failure display.
- One end-to-end happy path.

Tests must use mock AI mode and must not call OpenRouter.

## 23. Fixture Requirements

The project-meeting fixture should include:

- Two actual decisions.
- One proposal that is not accepted.
- Four action items.
- Two explicit owners.
- One missing owner.
- One explicit date.
- One vague deadline.
- One active blocker.
- One future risk.
- Two open questions.
- One prompt-injection sentence embedded as meeting text.

Also include customer interview and team stand-up fixtures.

## 24. Four-Day Delivery Plan

### Day 1: Vertical Slice

- Run the starter repo.
- Implement auth.
- Implement meeting creation.
- Persist transcript.
- Build dashboard shell.
- Return and render one mock analysis result.
- Open draft PR.

### Day 2: LangGraph And OpenRouter

- Implement graph state.
- Implement four core nodes.
- Add Zod output validation.
- Add mock model client.
- Add OpenRouter adapter.
- Persist node status.
- Render review screen.

### Day 3: Review And Reliability

- Add human-review interrupt.
- Resume with reviewed data.
- Implement Follow-Up and Planning agents.
- Persist finalized record.
- Preserve partial results.
- Add metrics and sanitized logging.
- Run OpenRouter evaluation.

### Day 4: Verification And Demo

- Stabilize.
- Run tests.
- Run typecheck, lint, and build.
- Complete docs.
- Prepare demo.
- Record known limitations.

## 25. Definition Of Done

### Product

- A user can register or sign in.
- A user can create a meeting.
- A user can paste or upload meeting content.
- A user can select one of four meeting types.
- LangGraph produces a validated core draft.
- The graph pauses for human review.
- The user can edit the draft.
- The graph resumes with reviewed data.
- Follow-up and agenda are generated from reviewed data.
- Meetings appear on the dashboard.
- Users cannot access another user's meeting.

### Engineering

- React, Express, MongoDB, JWT, LangGraph, and OpenRouter are used.
- Shared TypeScript contracts are used.
- External inputs are validated.
- Model outputs are validated.
- Mock AI mode works without an API key.
- Live OpenRouter mode works for the required evaluation.
- Partial failures preserve successful outputs.
- Secrets and transcripts are excluded from ordinary logs.
- Required tests pass or known failures are disclosed.

### Documentation

- README setup.
- Architecture summary.
- API documentation.
- Agent behavior.
- Data model.
- Test results.
- OpenRouter evaluation.
- Known limitations.
- Work log.

## 26. Acceptance Criteria

### Transcript Intake

Given an authenticated user with a draft meeting, when they paste at least 200 valid characters, then the transcript is saved and the meeting is eligible for analysis.

Given an unsupported file, when the user uploads it, then the API returns an unsupported-file error and the UI preserves the meeting form.

### Core Graph

Given a valid project-meeting transcript, when analysis runs in mock mode, then the four core agents return schema-valid results and the graph reaches human review.

### Partial Failure

Given one specialist returns malformed output twice, when the graph handles the failure, then successful sections remain available and the failed section is marked with a warning.

### Human Review

Given an action with an inferred owner, when the review UI displays it, then the owner is marked as inferred until the user confirms or changes it.

### Resume

Given a reviewed meeting record, when the graph resumes, then Follow-Up and Planning use reviewed values.

### Authorization

Given two registered users, when one user requests the other user's meeting, then access is denied and no meeting content is returned.

### OpenRouter Evaluation

Given the project-meeting fixture, when it is run with `openrouter/free` and one reasoning-capable free model, then the output comparison is documented without raw reasoning traces.

## 27. Evaluation Rubric

| Category | Weight |
|---|---:|
| Complete end-to-end functionality | 25% |
| LangGraph architecture and state management | 15% |
| OpenRouter integration and model evaluation | 15% |
| Code quality and maintainability | 15% |
| Testing, validation, and failure recovery | 15% |
| Product usability and judgment | 10% |
| Documentation and explanation | 5% |

## 28. Demo Script

Your final demo should show:

1. Sign in.
2. Dashboard.
3. Create project meeting.
4. Paste fixture transcript.
5. Start analysis.
6. Show agent progress.
7. Review summary and decisions.
8. Show inferred owner or date.
9. Edit the inferred value.
10. Show blocker with evidence.
11. Resume graph.
12. Generate follow-up email.
13. Generate next agenda.
14. Return to dashboard.
15. Explain partial-failure behavior.
16. Explain OpenRouter comparison.

## 29. Final Reminder

MeetingOS should help users leave a meeting with clarity. Keep the workflow practical, reviewable, and honest about uncertainty.

