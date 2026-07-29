# MeetingOS Assignment

**Project:** Agentic Meeting Product Manager and Follow-Up System  
**Codename:** MeetingOS  
**Duration:** 3 to 4 working days  
**Assignment type:** Individual full-stack prototype  
**Required AI provider:** OpenRouter free model access  
**Required workflow framework:** LangGraph.js

## Your Mission

Build a working prototype that turns a pasted meeting transcript or set of meeting notes into a reviewed, editable project record.

The user flow should be:

```text
Sign in
-> Create a meeting
-> Paste transcript or notes
-> Select meeting type
-> Start LangGraph analysis
-> Run specialist agents
-> Review and edit the generated draft
-> Resume the graph with reviewed data
-> Generate follow-up email and next agenda
-> Save completed meeting
-> View it from the dashboard
```

This is an individual full-stack assignment. You are responsible for frontend, backend, database, authentication, AI workflow, OpenRouter integration, tests, and documentation.

## Product Idea

MeetingOS helps a user turn messy meeting content into something useful:

- A concise summary.
- Confirmed decisions.
- Action items.
- Owners and deadlines when supported by evidence.
- Open questions.
- Risks and blockers.
- A follow-up email.
- A next-meeting agenda.
- A structured record saved to a dashboard.

AI output is not automatically trusted. The user must be able to review and edit the core record before follow-up and agenda content are generated.

## Meeting Types

Support these meeting types:

- Project meeting.
- Customer interview.
- Sales call.
- Team stand-up.

Project meeting mode is the required demo and test path. The other modes may share the same data structure with prompt or emphasis changes.

## Required Stack

### Frontend

- React.
- TypeScript.
- Vite.
- Tailwind CSS.
- React Router.
- React Hook Form or equivalent.
- Zod validation.

### Backend

- Node.js.
- Express.js.
- TypeScript.
- MongoDB with Mongoose.
- JWT authentication.
- Centralized validation.
- Centralized error handling.

### AI And Workflow

- LangGraph.js `StateGraph`.
- OpenRouter API.
- Free model access only unless written approval is provided.
- Mock and live AI modes.
- At least six named agent nodes.
- Zod-validated structured outputs.
- Human-review interrupt and graph resume.

### Testing

- Vitest or Jest.
- Supertest.
- React Testing Library.
- One end-to-end test or documented automated browser flow.

## Required LangGraph Flow

Your graph must include these logical stages:

```text
START
-> validateInput
-> prepareContext
-> run core extraction nodes:
   - Summary Agent
   - Decision Agent
   - Action Agent
   - Risk Agent
-> validateAndAggregate
-> humanReview interrupt
-> resume with reviewed data
-> run post-review nodes:
   - Follow-Up Agent
   - Planning Agent
-> finalizeRecord
-> END
```

The first four specialist agents should run in parallel where practical. Follow-Up and Planning must run only after the user reviews the core record.

## Agent Requirements

### Summary Agent

Produces:

- Neutral summary.
- Main themes.
- Outcome status.

It should not invent agreements or turn a loose discussion into a confirmed outcome.

### Decision Agent

Extracts decisions that were actually made.

Do not treat suggestions, excitement, brainstorming, or unresolved ideas as decisions.

### Action Agent

Extracts:

- Tasks.
- Owners.
- Deadlines.
- Dependencies.
- Evidence.

Unknown owners or dates must remain `null`. Do not invent them.

### Risk Agent

Identifies:

- Active blockers.
- Future risks.
- Likely impact.
- Cautious mitigations.

Separate real blockers from possible risks.

### Follow-Up Agent

Creates a professional email from the reviewed record.

It must not introduce new commitments that the user did not confirm.

### Planning Agent

Creates a next-meeting agenda based on:

- Open questions.
- Blockers.
- Risks.
- Upcoming commitments.
- Unresolved decisions.

## OpenRouter Requirements

Create your own OpenRouter API key and store it only in your local `.env`.

Use:

```env
AI_MODE=mock
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openrouter/free
OPENROUTER_REASONING_MODEL=
OPENROUTER_REASONING_EFFORT=medium
AI_REQUEST_TIMEOUT_MS=30000
AI_MAX_RETRIES=1
AI_MAX_CONCURRENCY=4
PROMPT_VERSION=meetingos-v1
```

Rules:

- Automated tests must run in mock mode.
- Tests must not call OpenRouter.
- Use `openrouter/free` for basic live smoke testing.
- Select one currently available reasoning-capable `:free` model for the comparison test.
- Do not assume a specific free model will remain available.
- Do not commit or share API keys.
- Do not store raw reasoning traces or chain-of-thought.
- Evaluate reasoning through observable output quality.

Record:

- Requested model.
- Actual returned model when available.
- Latency.
- Token usage when available.
- Validation result.
- Errors and retries.

## Required Screens

Build these screens or clear equivalent views:

1. Registration or sign-in.
2. Meeting dashboard.
3. New meeting form.
4. Analysis progress view.
5. Review workspace.
6. Completed meeting details.
7. Basic analysis metrics view or run details panel.

The review workspace must let the user:

- Edit the summary.
- Add, edit, or remove decisions.
- Add, edit, or remove action items.
- Confirm or change inferred owners and deadlines.
- Edit risks, blockers, and open questions.
- Resume the graph with reviewed data.
- Edit and copy the generated follow-up email.
- Edit the next-meeting agenda.

## Required Backend Behavior

Your Express API must support:

- Register and login.
- Current-user retrieval.
- Create, list, retrieve, update, and delete owned meetings.
- Save a transcript.
- Start an analysis.
- Retrieve analysis status and partial output.
- Resume an interrupted analysis with reviewed data.
- Retry a failed analysis or failed core node.
- Retrieve basic run metrics.

Every protected resource must enforce user ownership.

## Required Data

Persist at least:

- User.
- Meeting metadata.
- Original transcript.
- Analysis run.
- Graph thread ID.
- Per-node status and duration.
- Generated core draft.
- User-reviewed record.
- Follow-up email.
- Next agenda.
- Warnings and sanitized errors.
- Requested and actual model information when available.

Raw transcripts must not appear in ordinary application logs or analytics labels.

## Failure Handling

Handle:

- Invalid or short transcript.
- Authentication failure.
- Cross-user resource access.
- OpenRouter timeout.
- Rate limit or unavailable free model.
- Invalid model JSON.
- Zod validation failure.
- One failed specialist agent.
- Graph interruption and resume.
- Network failure in the frontend.

For malformed model output:

1. Validate it.
2. Retry once with concise validation feedback.
3. If it fails again, preserve successful node outputs.
4. Mark the run as a partial failure.
5. Show a warning to the user.

## Required Tests

At minimum, include tests for:

- Input and output Zod schemas.
- Authentication and ownership.
- Meeting creation.
- Mock analysis start.
- LangGraph parallel core nodes.
- Malformed model output and retry.
- Partial node failure.
- Human-review interrupt and resume.
- Reviewed values used by Follow-Up and Planning.
- One frontend review interaction.
- One end-to-end happy path.

Tests must not call OpenRouter.

## Live Model Evaluation

Run the same project-meeting fixture using:

1. `openrouter/free`.
2. One reasoning-capable free model selected at the start of the project.

Record:

- Requested model.
- Actual model returned, when available.
- Reasoning configuration used.
- Total latency.
- Input and output token usage, when available.
- Schema-valid result: yes or no.
- Correct decisions found.
- Unsupported decisions invented.
- Action-item completeness.
- Owner and date hallucinations.
- Evidence quality.
- Retry or fallback used.
- Rate-limit or availability problems.
- Which result you would use and why.

Do not submit hidden reasoning text. Submit your evaluation of the observable output.

## Four-Day Plan

### Day 1: Establish The Vertical Slice

- Run the base repository.
- Read the contracts and fixtures.
- Configure MongoDB and mock mode.
- Implement authentication.
- Implement meeting creation and transcript persistence.
- Build a minimal dashboard.
- Produce one end-to-end mock response.
- Open a draft pull request.

### Day 2: Build The LangGraph Analysis

- Define graph state.
- Implement the four parallel core agents.
- Add Zod schemas.
- Add mock and OpenRouter model adapters.
- Store analysis-run status.
- Display core output in the review screen.
- Add unit and contract tests.

### Day 3: Complete Human Review And Reliability

- Add LangGraph interrupt and resume.
- Implement Follow-Up and Planning agents.
- Persist reviewed and finalized records.
- Add partial-failure behavior.
- Add metrics and sanitized logging.
- Run the live OpenRouter comparison.
- Complete API integration tests.

### Day 4: Stabilize And Demonstrate

- Stop adding required features.
- Fix the complete workflow.
- Complete frontend and end-to-end tests.
- Run lint, typecheck, tests, and build.
- Complete documentation and evaluation results.
- Prepare a five-to-eight-minute demonstration.

For a three-day schedule, combine Days 1 and 2 and reduce visual polish. Do not remove the human-review step or live evaluation.

## Submission

Submit:

- One focused pull request or repository link.
- Working source code.
- Setup instructions.
- `.env.example` with placeholders only.
- Architecture explanation.
- LangGraph diagram.
- API summary.
- Data-model summary.
- Test results.
- OpenRouter evaluation report.
- Known limitations.
- Screenshots or short demonstration recording.
- Five-to-eight-minute live walkthrough.

Also include `WORK_LOG.md` with:

- What you personally implemented.
- Where you used AI coding assistance.
- One AI-generated suggestion you rejected or corrected.
- The hardest defect you found.
- What you would improve with two more days.

## Completion Standard

Your implementation is complete when:

- A user can register or sign in.
- A user can create and retrieve their own meeting.
- A transcript can be pasted and saved.
- LangGraph runs the four core agent nodes.
- Core output is structured and validated.
- The graph pauses for human review.
- User edits are accepted when the graph resumes.
- Follow-Up and Planning run from reviewed values.
- The completed record persists and appears on the dashboard.
- One agent can fail without destroying all successful output.
- Mock tests run without a live API key.
- The OpenRouter free-model comparison is documented.
- Secrets and transcripts are absent from ordinary logs.
- The repository passes its documented verification commands.

## Evaluation

You will be evaluated on:

- End-to-end functionality.
- LangGraph architecture and state management.
- OpenRouter integration and model judgment.
- Code structure and maintainability.
- Validation, testing, and recovery behavior.
- Product usability.
- Security and privacy judgment.
- Documentation and ability to explain your work.

Build something reliable, explainable, and honest about its limits.

