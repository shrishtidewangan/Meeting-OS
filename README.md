# MeetingOS Starter Repository

MeetingOS is an intern assessment project for the Agentic Meeting Product Manager and Follow-Up System.

This repository provides the shared starter scaffold only. Each assignee must build the complete MeetingOS prototype independently on their own branch created from `main`.

## Start Here

1. Read `docs/assignment/INTERN_ASSIGNMENT.md`.
2. Read `docs/assignment/PROJECT_SPEC.md`.
3. Read `docs/assignment/OPENROUTER_LANGGRAPH_GUIDE.md`.
4. Create your own branch from `main`.
5. Keep `WORK_LOG.md` updated as you build.

## Create Your Branch

```bash
git checkout main
git pull origin main
git checkout -b intern/<your-name>/meetingos-prototype
git push -u origin intern/<your-name>/meetingos-prototype
```

Do not push directly to `main`. Do not use another assignee's branch as your starting point.

## What This Starter Provides

- A pnpm workspace.
- React/Vite frontend starter app.
- Express backend starter app with `GET /health`.
- Shared package folders.
- Contract and validation skeletons.
- Route, controller, service, repository, model, graph, model-client, and observability placeholders.
- Fixture transcripts and mock result examples.
- Assignment documentation.
- Pull-request and issue templates.
- Basic scaffold verification scripts.

## What You Must Build

You must implement the real MeetingOS behavior:

- Authentication and JWT ownership checks.
- Meeting creation, retrieval, update, delete, and transcript persistence.
- LangGraph StateGraph with core agent nodes.
- Human-review interrupt and resume.
- Mock and OpenRouter model clients.
- Review workspace.
- Follow-up and agenda generation.
- Metrics and sanitized logging.
- Required tests and documentation.

## Local Setup

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm verify:scaffold
```

Run the apps:

```bash
pnpm dev
```

Default ports:

- Web: `http://localhost:5173`
- API: `http://localhost:3001`

## Environment

Copy `.env.example` to your local `.env` and fill in local values.

Rules:

- Keep `AI_MODE=mock` for tests.
- Do not commit `.env`.
- Do not commit OpenRouter API keys.
- Do not use paid models unless written approval is provided.
- Do not log API keys, transcript text, prompt text, or raw reasoning traces.

## Starter Boundary

This repo intentionally includes TODO placeholders. They are here to standardize structure, not to solve the assignment.

If a file throws `NotImplementedError` or says `TODO`, that is work for your branch.

