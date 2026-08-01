<!-- # Architecture Notes

Document your final architecture here.

Include:

- Frontend structure.
- Backend structure.
- Database boundaries.
- LangGraph diagram.
- Model-client adapter boundary.
- Mock and live AI modes.
- Human-review interrupt and resume flow.
- Failure recovery behavior.

TODO: replace this scaffold with your implementation notes. -->

# Architecture Notes

## Frontend Structure

React + TypeScript + Vite, using React Router for navigation and
React Hook Form for form validation (AuthPage, NewMeetingPage). Tailwind
CSS is used for styling across every page (AppShell, AuthPage,
DashboardPage, NewMeetingPage, MeetingDetailsPage, ReviewWorkspacePage,
RunDetailsPage, AnalysisProgressPage).

    apps/web/src/
      pages/          One component per route
      components/     Shared layout (AppShell)
      services/        Thin API client wrappers (apiClient, authApi,
                        meetingApi, analysisApi) — the only files that
                        call fetch() directly
      test/            Vitest + React Testing Library tests

The JWT is stored in localStorage (apiClient.ts's getToken/setToken/
clearToken) and attached to every request automatically. No component
calls OpenRouter or any AI provider directly — all AI work happens
server-side.

## Backend Structure

Node.js + Express + TypeScript + MongoDB/Mongoose, following a layered
architecture:

    apps/api/src/
      routes/          Express route definitions, wire middleware + controllers
      controllers/      HTTP layer — parse request, call service, shape response
      services/          Business logic (auth, meeting, analysis, metrics)
      repositories/      Data access layer (queries Mongoose models)
      models/            Mongoose schemas
      middleware/        requireAuth (JWT verification)
      graph/             LangGraph state, nodes, prompts, checkpointer
      model-client/       MeetingModelClient interface + Mock/OpenRouter adapters
      observability/      Sanitized logging (logInfo/sanitizeMetadata)
      config/             Centralized env loading and validation

packages/contracts (plain TypeScript types) and packages/validation
(the actual Zod schemas built from those types) are shared between
apps/api and apps/web, so both sides agree on the exact same shapes for
meeting input, the full MeetingAnalysis contract, and API envelopes.

## Database Boundaries

Three collections: users, meetings, analysisruns. Every query on
meetings/analysisruns is scoped by ownerId, taken from the JWT — never
from the request body or URL — enforced at the repository layer.
Ownership violations return 403 (resource exists, wrong owner) distinct
from 404 (resource doesn't exist), verified with a second real
registered user in both manual testing and a committed Supertest test.

## LangGraph Diagram

    START
      |
      v
    validateInput  (re-validates against meetingInputSchema —
    |                defense-in-depth, independent of the API layer)
      v
    prepareContext  (assembles prompt context incl. the
    |                "transcript is untrusted" prompt-injection notice)
      v
    +---------------------------------------------+
    |         (parallel fan-out)                    |
    v            v            v            v
    summaryAgent  decisionAgent  actionAgent  riskAgent
    |            |            |            |
    +---------------------------------------------+
      v
    validateCoreOutputs  (fails the run only if summaryAgent
    |                     — the minimum viable output — failed)
      v
    aggregateCoreDraft  (assembles + Zod-validates the core
    |                    draft via coreDraftSchema)
      v
    humanReview  <-- interrupt() pauses here, checkpointed by
    |               MemorySaver under thread_id
      | (resume with Command({ resume: reviewedRecord }),
      |  same thread_id)
      v
    +----------------------------+
    |    (parallel fan-out)        |
    v                            v
    followUpAgent              planningAgent
    (reads reviewedRecord,     (reads reviewedRecord,
     not raw extraction)        not raw extraction)
    |                            |
    +----------------------------+
      v
    finalizeRecord  (assembles + Zod-validates the final
    |                MeetingAnalysis, reviewedRecord takes
    |                precedence over raw AI output)
      v
    END

## Model-Client Adapter Boundary

Every graph node depends only on the MeetingModelClient interface
(generateStructured), never on an OpenRouter SDK or ChatOpenRouter
directly. Two implementations:

  MockMeetingModelClient    — canned, schema-valid responses per node,
                              zero network calls, used by all automated
                              tests and AI_MODE=mock
  OpenRouterMeetingModelClient — wraps @langchain/openrouter's
                              ChatOpenRouter, uses withStructuredOutput()
                              with includeRaw:true for token/model
                              metadata, retries once with the actual Zod
                              validation error fed back into the prompt

Which client gets passed into createMeetingGraph() is decided once, in
analysis.service.ts — the graph and nodes have no knowledge of which
one they're using.

## Mock And Live AI Modes

AI_MODE=mock is the default and requires no API key. The Day-1 mock
analysis endpoint (fixture-based, four canned scenarios: success,
partial-failure, timeout, malformed-output) still exists alongside the
real graph path and is used for the simple "one complete mock result"
UI demonstration. The actual "Run Analysis" button in the UI always
invokes the real LangGraph pipeline with MockMeetingModelClient
(AI_MODE=mock) — live OpenRouter mode requires manually swapping in
OpenRouterMeetingModelClient plus a real OPENROUTER_API_KEY, exercised
via the eval-live.ts script, never by automated tests.

## Human-Review Interrupt And Resume Flow

humanReviewNode calls LangGraph's interrupt(), which pauses the whole
graph and persists its state via MemorySaver, keyed by thread_id (set
to the analysis run's own ID). The frontend's Review Workspace lets the
user edit the summary, decisions, action items, risks/blockers, and
open questions (add/remove supported on decisions and action items).
Clicking "Confirm & Resume" calls
POST /api/meetings/:meetingId/analysis/:analysisRunId/resume, which
invokes graph.invoke(new Command({ resume: reviewedRecord }), { thread_id })
using the SAME thread_id — this is what lets LangGraph find the paused
checkpoint and continue exactly where it left off. followUpAgent and
planningAgent read state.reviewedRecord, not the raw extraction, so the
generated email/agenda are provably built from the user's edits: the
followUp/nextAgenda fields on the analysis result do not exist anywhere
in the system until after this resume call succeeds.

One architectural fix made during development: the compiled graph must
be a single shared module-level instance across the whole server
process, not recreated per request — MemorySaver's checkpoints only
exist in-memory on that specific object, so a fresh graph per call would
never find its own prior checkpoint on resume.

## Failure Recovery Behavior

Each of the six agent nodes independently catches its own
modelClient.generateStructured() errors and returns a warning + a
FAILED agentRuns entry, rather than throwing and aborting the whole
graph. validateCoreOutputs only hard-fails the run if summaryAgent (the
minimum viable output) failed; the other three core nodes failing
independently still allows the run to reach human review with whatever
succeeded. Verified both with a committed automated test (graph.test.ts
simulates actionAgent failing while three siblings succeed) and with
real live evidence (multiple OpenRouter evaluation runs where one or
more nodes genuinely timed out while others completed).

OpenRouterMeetingModelClient retries once on any failure (including
Zod validation failures), feeding the specific validation error message
back into the retry prompt so the model can self-correct, before giving
up and letting the node-level catch handle it as a warning.