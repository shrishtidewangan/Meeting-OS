# Delivery Plan And Checklist

Use this file as your daily build plan and final submission checklist.

## Delivery Model

You are building the complete MeetingOS prototype independently from the prepared starter repository.

Create your own branch from `main`:

```bash
git checkout main
git pull origin main
git checkout -b intern/<your-name>/meetingos-prototype
git push -u origin intern/<your-name>/meetingos-prototype
```

Commit in small, readable steps. Open a draft pull request by the end of Day 1.

Do not rewrite the starting commit. Do not commit generated dependencies, local databases, `.env`, API keys, or secrets.

## Day 1: Vertical Slice

### Setup

- [ ] Clone the repository.
- [ ] Install dependencies.
- [ ] Run the frontend.
- [ ] Run the backend.
- [ ] Run starter verification commands.
- [ ] Copy `.env.example` to your local `.env`.
- [ ] Configure MongoDB.
- [ ] Confirm `AI_MODE=mock`.
- [ ] Create your branch from `main`.
- [ ] Open a draft PR.

### Build

- [ ] Implement registration and login.
- [ ] Add JWT authentication.
- [ ] Create the meeting API.
- [ ] Save transcript or notes.
- [ ] Build a minimal dashboard.
- [ ] Build a new meeting form.
- [ ] Add a mock analysis endpoint or service.
- [ ] Render one complete mock result in the UI.

### Process

- [ ] Record setup notes and blockers in `WORK_LOG.md`.
- [ ] Keep visual polish secondary until the mock path works.
- [ ] Push your branch at least once.

## Day 2: LangGraph Core

- [ ] Define Zod contracts.
- [ ] Define graph state.
- [ ] Implement `validateInput`.
- [ ] Implement `prepareContext`.
- [ ] Implement Summary Agent.
- [ ] Implement Decision Agent.
- [ ] Implement Action Agent.
- [ ] Implement Risk Agent.
- [ ] Run core agents in parallel where practical.
- [ ] Aggregate core output.
- [ ] Persist analysis run and node status.
- [ ] Build analysis-progress UI.
- [ ] Build core review UI.
- [ ] Implement mock model client.
- [ ] Implement OpenRouter model client behind an adapter.
- [ ] Add graph contract tests.

## Day 3: Human Review And Reliability

- [ ] Compile the graph with a checkpointer.
- [ ] Add human-review interrupt.
- [ ] Add analysis resume endpoint.
- [ ] Resume with the same thread ID.
- [ ] Implement Follow-Up Agent.
- [ ] Implement Planning Agent.
- [ ] Use reviewed values after resume.
- [ ] Persist completed meeting record.
- [ ] Handle invalid structured output.
- [ ] Retry malformed model output once.
- [ ] Preserve partial results.
- [ ] Add sanitized logging.
- [ ] Add run metrics.
- [ ] Run `openrouter/free` smoke test.
- [ ] Run reasoning-capable free-model evaluation.
- [ ] Document the model comparison.

## Day 4: Verification And Demo

### Stabilize

- [ ] Stop adding required features.
- [ ] Fix the complete project-meeting path.
- [ ] Verify ownership checks.
- [ ] Verify no secret or transcript logging.
- [ ] Verify partial-failure UI.
- [ ] Verify interrupt and resume.

### Test

- [ ] Unit tests pass.
- [ ] API tests pass.
- [ ] Graph tests pass.
- [ ] Frontend interaction test passes.
- [ ] End-to-end happy path passes or is clearly documented if blocked.

Run your project's documented equivalents of:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

Record the exact results in `docs/TEST_RESULTS.md`.

### Document

- [ ] README setup instructions.
- [ ] Architecture explanation.
- [ ] LangGraph diagram.
- [ ] API summary.
- [ ] Data model summary.
- [ ] Agent behavior summary.
- [ ] OpenRouter evaluation.
- [ ] Known limitations.
- [ ] Work log.

### Prepare Demo

Prepare a five-to-eight-minute walkthrough:

1. Sign in.
2. Create a meeting.
3. Paste a transcript.
4. Start the graph.
5. Show node progress.
6. Review the output.
7. Edit an owner or date.
8. Resume the graph.
9. Show follow-up and agenda.
10. Show the saved dashboard record.
11. Explain one failure test.
12. Explain the OpenRouter model comparison.

## Required Submission Files

Your branch or PR should include:

```text
README.md
WORK_LOG.md
.env.example
docs/ARCHITECTURE.md
docs/API.md
docs/AGENTS.md
docs/DATA_MODEL.md
docs/TEST_RESULTS.md
docs/OPENROUTER_EVALUATION.md
docs/KNOWN_LIMITATIONS.md
```

## Pull Request Checklist

- [ ] The PR describes the complete workflow.
- [ ] Setup steps were tested from a clean environment where possible.
- [ ] No `.env` or secrets are committed.
- [ ] No paid model is configured by default.
- [ ] Mock mode works without OpenRouter.
- [ ] Live mode uses OpenRouter.
- [ ] LangGraph state, nodes, edges, interrupt, and resume are explained.
- [ ] Ownership checks are tested.
- [ ] Model output is validated locally.
- [ ] Partial failure is demonstrated.
- [ ] All claimed checks were actually run.
- [ ] Known failures are disclosed.

## Work Log Prompts

Answer briefly in `WORK_LOG.md`:

1. What did you implement first, and why?
2. Which part of the graph was hardest?
3. Where did you use AI coding assistance?
4. What AI-generated code or recommendation did you reject or correct?
5. Which test gives the strongest evidence that the prototype works?
6. What is the most serious current limitation?
7. What would you build with two more days?

## Prohibited Shortcuts

Do not:

- Call OpenRouter directly from React.
- Skip local output validation.
- Replace LangGraph with unrelated route handlers.
- Fake live-model evaluation results.
- Use another assignee's implementation.
- Claim tests passed without running them.
- Expose reasoning traces, transcripts, tokens, prompts, or API keys.
- Replace missing owners or dates with invented values.

