# Starter Repository Guide

This file explains what the prepared starter repository should give you, what you still need to build, and how to tell whether the starter repo is healthy before you begin.

## What You Should Expect

You should begin from the same starter commit as every other assignee.

The starter repo is not a finished application. It is a shared starting point that gives you structure, scripts, fixtures, and documentation so you can focus on building the prototype.

## What The Starter Repo May Include

### Workspace

- `pnpm` workspace or equivalent.
- React/Vite frontend app.
- Express backend app.
- Shared packages directory.
- TypeScript configuration.
- ESLint configuration.
- Test configuration.
- Tailwind configuration.

### Empty Architecture

- Route, controller, service, and repository directories.
- Graph directories.
- Model-client directories.
- Shared contract skeletons.
- Basic error class skeleton.
- Logger wrapper skeleton.

### Fixtures

- Project meeting transcript.
- Customer interview transcript.
- Team stand-up transcript.
- Schema-shaped mock success result.
- Mock partial-failure result.
- Prompt-injection fixture.

### Configuration

- `.env.example`.
- MongoDB connection placeholder.
- Mock AI selector.
- OpenRouter environment variable names.
- Development scripts.

### Documentation

- Project packet files.
- Contribution rules.
- Pull-request template.
- Branch naming guide.

## What You Must Build Yourself

The starter repo should not include completed versions of:

- User registration or login.
- JWT middleware.
- Meeting CRUD.
- Real MongoDB models beyond optional stubs.
- LangGraph state or graph implementation.
- Specialist graph nodes.
- Agent prompts.
- OpenRouter client implementation.
- Review workspace.
- Interrupt and resume logic.
- Follow-up or agenda generation.
- Metrics implementation.
- Required assessment tests.

If any of those are already finished in the starter repo, mention it in `WORK_LOG.md` and ask for clarification.

## Starter Scripts

The root `package.json` may include scripts like:

```json
{
  "scripts": {
    "dev": "run web and api",
    "build": "build all packages",
    "typecheck": "typecheck all packages",
    "lint": "lint all packages",
    "test": "run unit and integration tests",
    "test:e2e": "run end-to-end tests",
    "test:agents": "run graph and agent tests",
    "seed": "seed development fixtures",
    "eval:live": "run controlled OpenRouter evaluation"
  }
}
```

At minimum, the starter should let you install dependencies, run typecheck, run a starter test, and start placeholder frontend/backend apps.

## Environment Variables

Your `.env.example` should use placeholders only:

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

LANGSMITH_TRACING=false
LANGSMITH_API_KEY=
LANGSMITH_PROJECT=meetingos-prototype
LOG_LEVEL=info
```

Never commit your real `.env`.

## Fixture Requirements

The project-meeting fixture should contain:

- Two actual decisions.
- At least one proposal that is not accepted.
- Four action items.
- Two explicit owners.
- One missing owner.
- One explicit date.
- One vague deadline.
- One active blocker.
- One future risk.
- Two open questions.
- One prompt-injection sentence embedded as meeting text.

Use fixture outputs for mock mode. Do not treat fixtures as proof that live OpenRouter output is reliable.

## Before You Start Building

Run the starter verification commands and record the result in `WORK_LOG.md`.

Check:

- Dependencies install.
- Frontend starts.
- API starts.
- Starter test passes.
- Typecheck passes.
- `.env.example` has no real secrets.
- MongoDB instructions are usable.
- Fixtures are present.

If the starter repo itself is broken, document the issue before changing product code.

