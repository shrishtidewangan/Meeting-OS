// export function ReviewWorkspacePage() {
//   return (
//     <section className="panel">
//       <h1>Review Workspace Shell</h1>
//       <p className="muted">TODO: implement editable draft review and graph resume with reviewed data.</p>
//       <ul className="todo-list">
//         <li>Edit summary, decisions, action items, risks, blockers, and open questions.</li>
//         <li>Mark inferred owners and dates clearly.</li>
//         <li>Confirm or change inferred values.</li>
//         <li>Resume LangGraph with reviewed values.</li>
//       </ul>
//     </section>
//   );
// }

import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { getAnalysisStatus, type AnalysisRun } from "../services/analysisApi";

const TABS = [
  "Overview",
  "Decisions",
  "Action Items",
  "Risks & Blockers",
  "Open Questions",
  "Follow-Up",
  "Next Agenda",
  "Run Details",
] as const;
type Tab = (typeof TABS)[number];

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color = confidence >= 0.8 ? "#2e7d4f" : confidence >= 0.5 ? "#a3852c" : "#b3261e";
  return (
    <span style={{ fontSize: 12, color, fontWeight: 650, marginLeft: 8 }}>
      {pct}% confidence
    </span>
  );
}

function InferredTag({ inferred }: { inferred: boolean }) {
  if (!inferred) return null;
  return (
    <span
      style={{
        fontSize: 11,
        background: "#f0e6c8",
        color: "#7a5a00",
        padding: "1px 6px",
        borderRadius: 4,
        marginLeft: 8,
        fontWeight: 650,
      }}
    >
      INFERRED
    </span>
  );
}

export function ReviewWorkspacePage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const [searchParams] = useSearchParams();
  const runId = searchParams.get("runId");

  const [run, setRun] = useState<AnalysisRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  useEffect(() => {
    if (!meetingId || !runId) {
      setError("No analysis run specified. Start an analysis from the meeting details page first.");
      setLoading(false);
      return;
    }
    getAnalysisStatus(meetingId, runId)
      .then(setRun)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load analysis"))
      .finally(() => setLoading(false));
  }, [meetingId, runId]);

  if (loading) {
    return (
      <section className="panel">
        <p className="muted">Loading analysis...</p>
      </section>
    );
  }

  if (error || !run) {
    return (
      <section className="panel">
        <h1>Review Workspace</h1>
        <p style={{ color: "#b3261e" }}>{error ?? "Analysis not found."}</p>
        {meetingId && <Link to={`/meetings/${meetingId}`}>Back to meeting</Link>}
      </section>
    );
  }

  const analysis = run.result;

  if (!analysis) {
    return (
      <section className="panel">
        <h1>Review Workspace</h1>
        <p className="muted">
          This run has status <strong>{run.status}</strong> but no result is available yet.
        </p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Review Workspace</h1>
        <Link to={`/meetings/${meetingId}`}>Back to meeting</Link>
      </div>
      <p className="muted" style={{ marginTop: 4 }}>
        Run status: <strong>{run.status}</strong> &middot; Generated{" "}
        {new Date(analysis.generatedAt).toLocaleString()}
      </p>

      {run.warnings.length > 0 && (
        <div style={{ background: "#fdecea", border: "1px solid #f3b7b0", borderRadius: 6, padding: 12, marginTop: 12 }}>
          <strong style={{ color: "#b3261e" }}>Warnings</strong>
          <ul style={{ margin: "6px 0 0 18px" }}>
            {run.warnings.map((w, i) => (
              <li key={i}>
                {w.message} {w.nodeName && <span className="muted">({w.nodeName})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <nav style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 20, borderBottom: "1px solid #d9dfd6" }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 14px",
              border: "none",
              background: "none",
              borderBottom: activeTab === tab ? "2px solid #285f5f" : "2px solid transparent",
              fontWeight: activeTab === tab ? 700 : 500,
              color: activeTab === tab ? "#19201d" : "#5e6860",
              cursor: "pointer",
            }}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div style={{ paddingTop: 20 }}>
        {activeTab === "Overview" && (
          <div>
            <p>{analysis.summary.executiveSummary}</p>
            <p>
              <strong>Outcome:</strong> {analysis.summary.outcome.replace(/_/g, " ")}
            </p>
            <p>
              <strong>Themes:</strong> {analysis.summary.themes.join(", ")}
            </p>
          </div>
        )}

        {activeTab === "Decisions" && (
          <div>
            {analysis.decisions.length === 0 ? (
              <p className="muted">No decisions extracted.</p>
            ) : (
              analysis.decisions.map((d) => (
                <div key={d.id} style={{ borderBottom: "1px solid #ececec", padding: "12px 0" }}>
                  <p style={{ margin: 0 }}>
                    {d.statement}
                    <ConfidenceBadge confidence={d.confidence} />
                    <InferredTag inferred={d.inferred} />
                  </p>
                  <p className="muted" style={{ fontSize: 13, margin: "4px 0 0" }}>
                    Owner: {d.owner ?? "Not specified"} &middot; Evidence: "{d.evidence.excerpt}"
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "Action Items" && (
          <div>
            {analysis.actionItems.length === 0 ? (
              <p className="muted">No action items extracted.</p>
            ) : (
              analysis.actionItems.map((a) => (
                <div key={a.id} style={{ borderBottom: "1px solid #ececec", padding: "12px 0" }}>
                  <p style={{ margin: 0 }}>
                    <strong>{a.title}</strong>
                    <ConfidenceBadge confidence={a.confidence} />
                  </p>
                  {a.description && <p style={{ margin: "4px 0" }}>{a.description}</p>}
                  <p className="muted" style={{ fontSize: 13, margin: "4px 0 0" }}>
                    Owner: {a.owner ?? "Unassigned"}
                    <InferredTag inferred={a.ownerInferred} /> &middot; Due:{" "}
                    {a.dueDate ?? "Not specified"}
                    <InferredTag inferred={a.dueDateInferred} /> &middot; Status: {a.status}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "Risks & Blockers" && (
          <div>
            {analysis.risksAndBlockers.length === 0 ? (
              <p className="muted">No risks or blockers extracted.</p>
            ) : (
              analysis.risksAndBlockers.map((r) => (
                <div key={r.id} style={{ borderBottom: "1px solid #ececec", padding: "12px 0" }}>
                  <p style={{ margin: 0 }}>
                    <strong>{r.type}</strong> &middot; Impact: {r.impact}
                    <ConfidenceBadge confidence={r.confidence} />
                  </p>
                  <p style={{ margin: "4px 0" }}>{r.description}</p>
                  {r.mitigation && (
                    <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                      Suggested mitigation: {r.mitigation}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "Open Questions" && (
          <div>
            {analysis.openQuestions.length === 0 ? (
              <p className="muted">No open questions extracted.</p>
            ) : (
              analysis.openQuestions.map((q) => (
                <div key={q.id} style={{ borderBottom: "1px solid #ececec", padding: "12px 0" }}>
                  <p style={{ margin: 0 }}>
                    {q.question}
                    <ConfidenceBadge confidence={q.confidence} />
                  </p>
                  <p className="muted" style={{ fontSize: 13, margin: "4px 0 0" }}>
                    Suggested owner: {q.suggestedOwner ?? "Not specified"}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "Follow-Up" && (
          <div>
            <p>
              <strong>Subject:</strong> {analysis.followUp.subject}
            </p>
            <p style={{ whiteSpace: "pre-wrap" }}>{analysis.followUp.body}</p>
          </div>
        )}

        {activeTab === "Next Agenda" && (
          <div>
            <p>
              <strong>{analysis.nextAgenda.title}</strong>
            </p>
            <p className="muted">
              Suggested duration: {analysis.nextAgenda.suggestedDurationMinutes} minutes
            </p>
            {analysis.nextAgenda.objectives.length > 0 && (
              <>
                <strong>Objectives</strong>
                <ul>
                  {analysis.nextAgenda.objectives.map((o, i) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>
              </>
            )}
            {analysis.nextAgenda.items.length > 0 && (
              <>
                <strong>Agenda Items</strong>
                <ul>
                  {analysis.nextAgenda.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {activeTab === "Run Details" && (
          <div>
            <p>
              <strong>Analysis Run ID:</strong> {analysis.analysisRunId}
            </p>
            <p>
              <strong>Status:</strong> {run.status}
            </p>
            <p>
              <strong>Requested model:</strong> {run.requestedModel} &middot;{" "}
              <strong>Actual model:</strong> {run.actualModel ?? "n/a"}
            </p>
            <p>
              <strong>Started:</strong> {new Date(run.startedAt).toLocaleString()}
              {run.completedAt && (
                <>
                  {" "}
                  &middot; <strong>Completed:</strong> {new Date(run.completedAt).toLocaleString()}
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

