# MeetingOS Project Packet

**Project:** Agentic Meeting Product Manager and Follow-Up System  
**Codename:** MeetingOS  
**Duration:** 3 to 4 working days  
**Assignment type:** Individual full-stack prototype  
**Required AI provider:** OpenRouter free model access  
**Required workflow framework:** LangGraph.js

## Start Here

You are building MeetingOS, a prototype that turns pasted meeting notes or transcripts into a reviewed, editable project record.

The important idea is simple:

```text
Meeting content -> AI-generated draft -> human review -> follow-up and agenda -> saved project record
```

The AI suggests structure. The user confirms, edits, and finalizes it.

This is an individual assignment. You are responsible for the full workflow: frontend, backend, database, authentication, LangGraph workflow, OpenRouter integration, tests, and documentation.

## What To Read First

Read the files in this order:

1. `INTERN_ASSIGNMENT.md`
2. `PROJECT_SPEC.md`
3. `OPENROUTER_LANGGRAPH_GUIDE.md`
4. `DELIVERY_PLAN_AND_CHECKLIST.md`
5. `EVALUATION_RUBRIC.md`
6. `OFFICIAL_REFERENCES.md`
7. `STARTER_REPO_REQUIREMENTS.md`

## Your Goal

Build a working prototype where a user can:

- Register or sign in.
- Create a meeting.
- Paste a transcript or notes.
- Select a meeting type.
- Start a LangGraph analysis.
- See analysis progress.
- Review and edit the generated draft.
- Resume the graph with reviewed data.
- Generate a follow-up email and next-meeting agenda.
- Save and reopen the completed meeting from a dashboard.

## Required Meeting Types

Your app must support these meeting types:

- Project meeting
- Customer interview
- Sales call
- Team stand-up

Project meeting mode is the main demo and test path.

## Required Technical Stack

Use:

- React, TypeScript, Vite, and Tailwind for the frontend.
- Node.js, Express, TypeScript, MongoDB, and Mongoose for the backend.
- JWT authentication.
- Zod for input and output validation.
- LangGraph.js for the analysis workflow.
- OpenRouter for live model calls.
- Mock mode for tests and local deterministic development.

## Branch Workflow

Start from the prepared `main` branch.

Create your own branch:

```bash
git checkout main
git pull origin main
git checkout -b intern/<your-name>/meetingos-prototype
git push -u origin intern/<your-name>/meetingos-prototype
```

Open a draft pull request by the end of Day 1. Keep your work on your own branch.

## What The Starter Repo Gives You

The starter repo may include:

- A workspace structure.
- Empty frontend and backend apps.
- Placeholder folders.
- Starter contracts.
- Fixture transcripts.
- Mock fixture outputs.
- `.env.example`.
- Basic verification scripts.
- These project documents.

The starter repo should not contain the finished product. You are expected to implement the actual behavior.

## What Not To Do

Do not:

- Commit `.env` or API keys.
- Call OpenRouter directly from React.
- Skip local Zod validation.
- Replace LangGraph with unrelated route handlers.
- Store raw reasoning traces or chain-of-thought.
- Log transcripts, secrets, or prompt text.
- Invent missing owners or deadlines.
- Claim tests passed without running them.
- Use another intern's implementation.

## How You Will Be Evaluated

You will be evaluated on whether the prototype works end to end, whether the LangGraph workflow is real and explainable, whether OpenRouter is integrated safely, whether tests cover meaningful risks, and whether you can explain the decisions you made.

The best submission is not the biggest codebase. It is the clearest working prototype you can stand behind.

