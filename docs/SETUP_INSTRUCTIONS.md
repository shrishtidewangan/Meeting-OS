# MeetingOS — Setup Instructions

## Prerequisites

- Node.js 20 or higher
- pnpm 9 or higher (`npm install -g pnpm`)
- MongoDB running locally, or a connection string to a remote instance

## 1. Clone the repository

    git clone <repo-url>
    cd Agentic-Meeting-Product-Manager-and-FollowUp-System
    git checkout intern/shrishti-dewangan/meetingos-prototype

## 2. Install dependencies

    pnpm install

This installs dependencies for every package in the workspace
(apps/api, apps/web, packages/contracts, packages/validation) in one
command.

## 3. Set up your environment file

    cp .env.example .env

Open `.env` and fill in these values at minimum:

    MONGODB_URI=mongodb://localhost:27017/meetingos
    JWT_SECRET=<any-random-development-string>
    JWT_ISSUER=meetingos-api

Leave `AI_MODE=mock` as-is — this is the default and requires no
OpenRouter API key. Mock mode is what the app uses out of the box and
is what all automated tests run against.

Never commit your real `.env` file.

## 4. Start MongoDB

If running locally:

    mongod

Or point `MONGODB_URI` at an existing remote MongoDB instance instead.

## 5. Run the verification scripts (optional but recommended)

    pnpm verify:scaffold
    pnpm check:no-secrets

The second script scans your tracked files and confirms nothing was
accidentally committed with a real API key or secret in it. It should
print "No obvious committed secrets found."

## 6. Start the app

    pnpm dev

This runs both the API and the web app together:

- API: http://localhost:3001
- Web app: http://localhost:5173

## 7. (Optional) Seed demo data

    pnpm seed

Creates a demo account and pre-loads it with the real fixture
transcripts as meetings:

    Email: demo@meetingos.local
    Password: password123

## 8. Register or log in

Open http://localhost:5173/auth in your browser and either register a
new account or log in with the seeded demo account above.

## 9. Try the full flow

1. Create a new meeting, pasting or uploading a transcript
2. Click "Run Analysis" on the meeting details page
3. Watch the Analysis Progress page — four core agents run in
   parallel
4. Click "Go to Review Workspace" once the run reaches NEEDS_REVIEW
5. Edit anything you like — a decision's owner, an action item's due
   date — then click "Confirm & Resume"
6. See the generated Follow-Up email and Next Agenda tabs populate
7. Check the dashboard — the meeting now shows as FINALIZED

## Running Tests

    pnpm typecheck              # all packages
    pnpm lint                   # all packages
    pnpm test                   # unit + contract tests, all packages
    pnpm --filter api exec vitest run src/graph   # LangGraph tests specifically
    pnpm build                  # all packages

For end-to-end tests, start both dev servers first (step 6 above),
then in a separate terminal:

    pnpm test:e2e

All automated tests run in mock mode and never call OpenRouter — no
API key is required to run the full test suite. See
`docs/TEST_RESULTS.md` for a full, verbatim record of every command's
actual output.

## Running Live OpenRouter Mode (Optional)

Mock mode is the default and is what the UI's "Run Analysis" button
uses. To evaluate against real OpenRouter models instead:

1. Get a free API key from https://openrouter.ai/keys
2. Add it to your `.env`:

       OPENROUTER_API_KEY=your-key-here

3. Pick a currently available reasoning-capable `:free` model from
   https://openrouter.ai/models and set:

       OPENROUTER_REASONING_MODEL=provider/model-name:free

4. Run the live comparison script:

       pnpm eval:live

   This spends real (free-tier) API usage and prints a full comparison
   between `openrouter/free` and your configured reasoning model
   against the real project-meeting fixture. See
   `docs/OPENROUTER_EVALUATION.md` for a full recorded evaluation
   already run and documented, including a real reliability issue that
   was found and fixed (a request timeout that was too tight for
   free-tier model latency).

## Troubleshooting

- **"Cannot find module" errors after a fresh install**: this is
  usually your editor's TypeScript server showing a stale cache, not a
  real error. Restart it (VS Code: Ctrl+Shift+P ->
  "TypeScript: Restart TS Server"), or fully reload the editor window.
  Confirm the actual error by running the real command
  (`pnpm --filter web typecheck`) rather than trusting the editor's
  display alone.
- **Port already in use**: another process may already be using 3001
  or 5173 — stop it, or change `API_PORT` in `.env` and the web dev
  server's port in `apps/web/vite.config.ts`.
- **MongoDB connection errors**: confirm `mongod` is actually running
  and `MONGODB_URI` in `.env` matches how you're running it.
- **`pnpm install` behaving unexpectedly after switching branches or
  packages**: try a clean reinstall —

      rm -rf node_modules apps/*/node_modules packages/*/node_modules
      pnpm install

  Do this with the existing `pnpm-lock.yaml` intact rather than
  deleting it, to avoid unintentionally upgrading unrelated
  dependencies.