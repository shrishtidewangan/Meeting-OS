# MeetingOS Submission

## Summary

Describe the complete workflow you implemented.

## Demo Evidence

Add screenshots, a recording link, or clear demo notes.

## LangGraph

Explain:

- State shape.
- Nodes.
- Edges.
- Parallel core extraction.
- Human-review interrupt.
- Resume with same thread ID.
- Partial-failure handling.

## OpenRouter

Explain:

- Mock mode.
- Live OpenRouter mode.
- `openrouter/free` smoke test.
- Reasoning-capable free-model comparison.
- Requested and actual model tracking.

## Tests

List exact commands run and results.

## Checklist

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
- [ ] Raw reasoning traces, transcripts, tokens, prompts, and API keys are not exposed.

## AI-Assisted Coding Disclosure

Describe where you used AI help and one suggestion you rejected or corrected.

