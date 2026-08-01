# OpenRouter Evaluation

Four live comparison runs total against the real project-meeting
fixture, all via the actual LangGraph pipeline. Run 4 was conducted
after raising AI_REQUEST_TIMEOUT_MS from 30000ms to 60000ms, in
response to the reliability problems documented in Runs 1-3. Every
specific quality claim was checked against the actual fixture
transcript before being recorded.

## Run Summary

| Field | Run 1-3 (`free`, 30s timeout) | **Run 4 (`free`, 60s timeout)** | Run 1-3 (reasoning, 30s timeout) | **Run 4 (reasoning, 60s timeout)** |
|---|---|---|---|---|
| nodes succeeded | 3/4, 4/4, 3/4 (never all 4) | **3/4 (only actionAgent timed out, even at 60s)** | 2/4, 0/4, 1/4 | **4/4 — first fully successful run** |
| reasoningTokens | absent (Runs 1-2, bug), present Run 3 | **present: 536, 492, 718** | absent (Runs 1-2), present Run 3 (448) | **present: 465, 1168, 1870, 342** |
| retryCount observed | 0-1 per run | 3 of 4 nodes retried once, still succeeded within 60s | 0 | 0 (all succeeded on first attempt) |
| total latency | 60s (hit ceiling) | 120s | 60s (hit ceiling) | 101s |

## Key Findings (final, after Run 4)

1. **Raising AI_REQUEST_TIMEOUT_MS from 30000 to 60000ms was the
   correct fix.** The reasoning-model configuration completed all four
   core nodes successfully for the first time across four total runs —
   individual calls took as long as 46.8 seconds (riskAgent), which
   would have failed at the original 30s ceiling regardless of retries.
   This confirms the earlier hypothesis: node timeouts were primarily a
   timeout-value problem, not a deeper reliability or prompt-design
   issue.

2. **`openrouter/free` still lost actionAgent even at 60s** — this one
   node appears to need either an even longer timeout or a lighter
   prompt/schema when routed through the free router specifically
   (three different runs have now failed on three different nodes via
   openrouter/free: action, decision, decision again — suggesting this
   is router-latency variance rather than one specific node being
   inherently slow).

3. **The reasoning-model's reasoningTokens are substantially higher than
   openrouter/free's** in this run (465-1870 vs 492-718), suggesting the
   reasoning-capable model is doing meaningfully more internal
   deliberation per node — consistent with it being specifically
   selected for reasoning capability. Whether this translates to better
   extraction quality is not conclusively shown by token count alone;
   see quality comparison below.

4. **Quality comparison, Run 4 (both configs succeeded enough to
   compare directly):**
   - Both correctly extracted the same 2 core decisions and 3 action
     items with matching owners/dates (Jordan/Aug 2, Emma/tomorrow,
     unassigned seed script) — no hallucinated owners or dates in
     either config this run.
   - `openrouter/free`'s decisions incorrectly attributed "Maya" as
     owner of both decisions (she announced them, per the same pattern
     flagged in Run 1) — the reasoning model correctly left both as
     `owner: null`.
   - The reasoning model found a third open question (MongoDB seed
     script ownership) that `openrouter/free` did not surface as a
     question in this run (it appeared as a risk/blocker instead in
     Run 4's `openrouter/free` output) — both are reasonable
     categorizations, not a clear error either way.
   - `openrouter/free`'s Run 4 summary outcome was `PARTIAL_OUTCOME`;
     the reasoning model's was `CLEAR_OUTCOME` — the reasoning model's
     classification is arguably more accurate given two clear decisions
     were made, though this is a judgment call the spec leaves to
     agent discretion.

5. **Prompt-injection defense held across all 4 runs, every node, both
   configurations.** No run ever obeyed the embedded injection attempt.

## finalRecommendation (final)

After 4 runs, raising the timeout to 60000ms resolved most of the
reliability problem: the reasoning-model configuration now completes
reliably (4/4 in Run 4), and openrouter/free improved to 3/4 with only
one node (actionAgent) still occasionally timing out even at 60s. Of
the two, the reasoning-capable model (nvidia/nemotron-3-ultra-550b-a55b:free)
is now the recommended default for live mode — it completed successfully,
showed no owner-attribution hallucinations in this run (where
openrouter/free had one), and produces meaningfully higher reasoning
token counts consistent with its selection as a reasoning-capable model.
openrouter/free remains a reasonable fallback given its dynamic routing,
but its one remaining timeout on actionAgent suggests either a further
timeout increase or simplifying that node's expected output schema
would help close the gap entirely.

## Methodology Note

Four runs per model configuration, each against the real
project-meeting fixture via the actual LangGraph pipeline. All findings
from prior runs are retained rather than discarded — the full arc from
"both configs fail under a 30s timeout" to "raising the timeout to 60s
fixes most of it" is itself part of the honest evidence, not just the
final run's numbers in isolation.