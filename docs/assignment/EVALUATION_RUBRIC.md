# Evaluation Rubric

This file shows how your MeetingOS submission will be evaluated. Use it while building so your work is aligned with the review.

## Weighted Score

| Category | Weight |
|---|---:|
| Complete end-to-end functionality | 25% |
| LangGraph architecture and state management | 15% |
| OpenRouter integration and model evaluation | 15% |
| Code quality and maintainability | 15% |
| Testing, validation, and failure recovery | 15% |
| Product usability and judgment | 10% |
| Documentation and explanation | 5% |

## Score Scale

| Score | Meaning |
|---|---|
| 5 | Complete, reliable, well-tested, clearly reasoned, and independently explainable |
| 4 | Strong implementation with minor gaps or polish issues |
| 3 | Functional core with meaningful omissions or quality problems |
| 2 | Partial implementation requiring substantial correction |
| 1 | Incomplete, unusable, copied without understanding, or unsupported by evidence |

## What Matters Most

### Complete End-To-End Functionality: 25%

The strongest evidence is a working user flow:

- Register or sign in.
- Create a meeting.
- Save a transcript.
- Run the core graph.
- Review and edit output.
- Resume the graph.
- Generate follow-up and agenda.
- Retrieve the completed record from the dashboard.

A polished interface does not compensate for a broken workflow.

### LangGraph Architecture And State Management: 15%

Your graph should show:

- Clear state schema.
- Correct node boundaries.
- Parallel core nodes where practical.
- Controlled edges.
- Human-review interrupt.
- Resume with the same thread ID.
- Checkpointer use.
- Reviewed-record precedence after resume.
- Partial-result preservation.
- Understanding of interrupt re-execution behavior.

### OpenRouter Integration And Model Evaluation: 15%

Your AI layer should show:

- Provider access isolated behind an adapter.
- Mock and live modes.
- Free access used correctly.
- Configurable model IDs.
- Structured-output handling.
- Requested and actual model recorded when available.
- Reasoning-capable free-model comparison.
- Quality judgment grounded in observable evidence.
- Rate-limit and unavailable-model handling.
- No raw reasoning-trace storage.

### Code Quality And Maintainability: 15%

Reviewers will look for:

- Good TypeScript.
- Clear route, controller, service, repository, graph, adapter, and component boundaries.
- Reusable frontend components.
- Minimal duplicated business logic.
- Useful names.
- Helpful comments where needed.
- Clean configuration.
- No secret leakage.

### Testing, Validation, And Failure Recovery: 15%

Your test evidence should include:

- Meaningful Zod schemas.
- Unit tests.
- API tests.
- Graph tests.
- At least one frontend interaction test.
- One end-to-end happy path.
- Invalid model output retry.
- Partial node failure.
- Ownership checks.
- Mock tests that do not call OpenRouter.

### Product Usability And Judgment: 10%

The app should be understandable to a real user:

- The workflow is clear.
- Loading and error states are useful.
- Inferred values are visibly marked.
- Human review is easy to understand.
- Follow-up and agenda are editable.
- Basic accessibility is present.
- Scope stays focused on the required prototype.

### Documentation And Explanation: 5%

Your docs should make the project easy to run and review:

- Setup instructions.
- Architecture explanation.
- LangGraph diagram.
- API summary.
- Data model summary.
- Test results.
- OpenRouter evaluation.
- Known limitations.
- Work log.

You should also be able to explain what you built and why.

## Score Caps

Some issues limit the maximum score even if other parts look good.

| Condition | Maximum recommended score |
|---|---:|
| No working end-to-end path | 3.0 / 5 |
| LangGraph not used | 2.5 / 5 |
| No human-review interrupt and resume | 3.0 / 5 |
| No live OpenRouter evaluation | 3.5 / 5 |
| Secrets committed | 2.0 / 5 until removed and rotated |
| Cannot explain major portions of submitted code | 2.0 / 5 |
| Claims tests passed without evidence | 2.5 / 5 |

## Questions You Should Be Ready To Answer

1. Walk through the graph state from start to finish.
2. Which nodes run in parallel, and why?
3. What happens when one core node fails twice?
4. How does the graph pause and resume?
5. Why must the same thread ID be reused?
6. Which values can the user change before resume?
7. How do you prove Follow-Up used reviewed data?
8. How is OpenRouter isolated from graph logic?
9. Which model did the free router actually return?
10. How did the reasoning-capable model differ?
11. What did Zod reject during development?
12. What information is deliberately excluded from logs?
13. How do you prevent one user from accessing another user's meeting?
14. Which test would you trust most before a demo?
15. What would fail first under higher load?

## Evaluation Notes Template

You do not need to fill this out unless asked, but it shows the review format.

```text
Name:
Repository:
Branch or PR:
Reviewer:
Date:

End-to-end functionality: __ / 5
LangGraph architecture: __ / 5
OpenRouter integration: __ / 5
Code quality: __ / 5
Testing and recovery: __ / 5
Product usability: __ / 5
Documentation: __ / 5

Weighted total: __ / 5

Strongest evidence:
Most important defect:
Technical depth observed:
Ownership and communication:
Recommended next assignment:
```

