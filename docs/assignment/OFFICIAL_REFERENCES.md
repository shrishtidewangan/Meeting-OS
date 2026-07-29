# Official Technical References

Use these official references while building MeetingOS. Prefer these docs over tutorials or older examples when there is a conflict.

**Reference check date:** July 28, 2026

## OpenRouter

### Free Models Router

- Documentation: <https://openrouter.ai/docs/guides/routing/routers/free-router>
- Model ID: `openrouter/free`
- Why it matters: `openrouter/free` routes requests to currently available free models. The selected model, latency, and availability may vary.

### Free Model Variants

- Documentation: <https://openrouter.ai/docs/guides/routing/model-variants/free>
- Why it matters: some supported models expose a `:free` variant. Choose a currently available reasoning-capable `:free` model for your comparison test.

### Model Metadata And Capabilities

- Documentation: <https://openrouter.ai/docs/guides/overview/models>
- Why it matters: model metadata can show supported parameters such as reasoning, structured outputs, response format, tools, and token information.

### Reasoning Configuration

- Documentation: <https://openrouter.ai/docs/guides/best-practices/reasoning-tokens>
- Why it matters: OpenRouter normalizes reasoning settings with the `reasoning` parameter. Dynamic routers such as `openrouter/free` do not have one stable reasoning profile.

### Structured Outputs

- Documentation: <https://openrouter.ai/docs/guides/features/structured-outputs>
- Why it matters: compatible models can use JSON Schema response formats. You must still validate locally with Zod.

### Provider Routing

- Documentation: <https://openrouter.ai/docs/guides/routing/provider-selection>
- Why it matters: provider routing, fallbacks, parameter requirements, and data-collection settings may affect which backend model handles a request.

## LangChain And LangGraph JavaScript

### ChatOpenRouter

- Documentation: <https://docs.langchain.com/oss/javascript/integrations/chat/openrouter>
- Package: `@langchain/openrouter`
- Why it matters: this package can connect LangChain/LangGraph code to OpenRouter and may support structured output, token usage, provider routing, and multi-model routing.

### LangGraph Graph API

- Documentation: <https://docs.langchain.com/oss/javascript/langgraph/graph-api>
- Why it matters: MeetingOS must use a graph workflow built from shared state, nodes, and edges.

### Workflows, Agents, And Parallelization

- Documentation: <https://docs.langchain.com/oss/javascript/langgraph/workflows-agents>
- Why it matters: the Summary, Decision, Action, and Risk nodes should run in parallel where practical.

### Interrupts

- Documentation: <https://docs.langchain.com/oss/javascript/langgraph/interrupts>
- Why it matters: `interrupt()` pauses execution, persists state through a checkpointer, and resumes with `Command`. The same `thread_id` must be reused.

### Persistence

- Documentation: <https://docs.langchain.com/oss/javascript/langgraph/persistence>
- Why it matters: checkpoints are organized by thread and support human review, recovery, and state history.

## Project Rules Based On These References

- Use OpenRouter free access for live evaluation.
- Use `openrouter/free` for the smoke test.
- Choose a currently available reasoning-capable free model at project time.
- Do not hard-code a model that may disappear from free availability.
- Do not store or submit raw reasoning traces.
- Use LangGraph.
- Use a human-review interrupt and resume flow.
- `MemorySaver` is acceptable for a local prototype if you document that checkpoints are lost on restart.
- Validate model outputs locally with Zod even if the provider supports structured output.

