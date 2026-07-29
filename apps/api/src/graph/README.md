# Graph Scaffold

This folder is reserved for the MeetingOS LangGraph workflow.

Required graph stages:

```text
START
-> validateInput
-> prepareContext
-> summaryAgent
-> decisionAgent
-> actionAgent
-> riskAgent
-> validateCoreOutputs
-> aggregateCoreDraft
-> humanReview interrupt
-> resume with reviewed record
-> followUpAgent
-> planningAgent
-> finalizeRecord
-> END
```

The four core extraction nodes should run in parallel where practical. Implement the real `StateGraph`, reducers, checkpointer, interrupt, resume, retry, and fallback behavior in your branch.

