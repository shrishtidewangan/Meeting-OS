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
import { getAnalysisStatus, resumeAnalysis, type AnalysisRun } from "../services/analysisApi";
import type { Decision, ActionItem, RiskOrBlocker, OpenQuestion } from "@meetingos/contracts";

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

const EDITABLE_STATUSES = ["NEEDS_REVIEW", "PARTIAL_FAILURE"];

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

const inputStyle = { padding: 6, border: "1px solid #d9dfd6", borderRadius: 4, fontSize: 14 };
const smallBtnStyle = {
  padding: "4px 10px",
  fontSize: 12,
  border: "1px solid #d9dfd6",
  borderRadius: 4,
  background: "#fff",
  cursor: "pointer",
};

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function ReviewWorkspacePage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const [searchParams] = useSearchParams();
  const runId = searchParams.get("runId");

  const [run, setRun] = useState<AnalysisRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  // Editable copies — initialized once the run loads, only meaningful
  // while status is NEEDS_REVIEW/PARTIAL_FAILURE (before resume).
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [risksAndBlockers, setRisksAndBlockers] = useState<RiskOrBlocker[]>([]);
  const [openQuestions, setOpenQuestions] = useState<OpenQuestion[]>([]);

  const [resuming, setResuming] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

  useEffect(() => {
    if (!meetingId || !runId) {
      setError("No analysis run specified. Start an analysis from the meeting details page first.");
      setLoading(false);
      return;
    }
    getAnalysisStatus(meetingId, runId)
      .then((result) => {
        setRun(result);
        if (result.result) {
          setDecisions(result.result.decisions ?? []);
          setActionItems(result.result.actionItems ?? []);
          setRisksAndBlockers(result.result.risksAndBlockers ?? []);
          setOpenQuestions(result.result.openQuestions ?? []);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load analysis"))
      .finally(() => setLoading(false));
  }, [meetingId, runId]);

  const isEditable = run ? EDITABLE_STATUSES.includes(run.status) : false;

  async function handleResume() {
    if (!meetingId || !runId) return;
    setResumeError(null);
    setResuming(true);
    try {
      // Marking confirmedByUser: true on every action item, since by
      // definition it has now passed through human review.
      const updatedRun = await resumeAnalysis(meetingId, runId, {
        decisions,
        actionItems: actionItems.map((a) => ({ ...a, confirmedByUser: true })),
        risksAndBlockers,
        openQuestions,
      });
      setRun(updatedRun);
      setActiveTab("Follow-Up");
    } catch (err) {
      setResumeError(err instanceof Error ? err.message : "Failed to resume analysis");
    } finally {
      setResuming(false);
    }
  }

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

      {isEditable && (
        <div style={{ background: "#eef5f0", border: "1px solid #bcdcc5", borderRadius: 6, padding: 12, marginTop: 12 }}>
          This draft is awaiting your review. Edit decisions, action items, risks, and
          open questions below, then click <strong>Confirm &amp; Resume</strong> to
          generate the follow-up email and next-meeting agenda from your reviewed data.
        </div>
      )}

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
            {decisions.length === 0 && <p className="muted">No decisions.</p>}
            {decisions.map((d, i) => (
              <div key={d.id} style={{ borderBottom: "1px solid #ececec", padding: "12px 0" }}>
                {isEditable ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 560 }}>
                    <textarea
                      value={d.statement}
                      onChange={(e) => {
                        const copy = [...decisions];
                        copy[i] = { ...d, statement: e.target.value };
                        setDecisions(copy);
                      }}
                      rows={2}
                      style={inputStyle}
                    />
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="text"
                        placeholder="Owner (leave blank if unknown)"
                        value={d.owner ?? ""}
                        onChange={(e) => {
                          const copy = [...decisions];
                          copy[i] = { ...d, owner: e.target.value || null, inferred: false };
                          setDecisions(copy);
                        }}
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <InferredTag inferred={d.inferred} />
                      <button
                        type="button"
                        style={smallBtnStyle}
                        onClick={() => setDecisions(decisions.filter((_, idx) => idx !== i))}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p style={{ margin: 0 }}>
                      {d.statement}
                      <ConfidenceBadge confidence={d.confidence} />
                      <InferredTag inferred={d.inferred} />
                    </p>
                    <p className="muted" style={{ fontSize: 13, margin: "4px 0 0" }}>
                      Owner: {d.owner ?? "Not specified"} &middot; Evidence: "{d.evidence.excerpt}"
                    </p>
                  </>
                )}
              </div>
            ))}
            {isEditable && (
              <button
                type="button"
                style={{ ...smallBtnStyle, marginTop: 8 }}
                onClick={() =>
                  setDecisions([
                    ...decisions,
                    {
                      id: makeId("decision"),
                      statement: "",
                      owner: null,
                      evidence: { excerpt: "Added during review", sourceType: "USER_CONTEXT" },
                      confidence: 1,
                      inferred: false,
                    },
                  ])
                }
              >
                + Add decision
              </button>
            )}
          </div>
        )}

        {activeTab === "Action Items" && (
          <div>
            {actionItems.length === 0 && <p className="muted">No action items.</p>}
            {actionItems.map((a, i) => (
              <div key={a.id} style={{ borderBottom: "1px solid #ececec", padding: "12px 0" }}>
                {isEditable ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 560 }}>
                    <input
                      type="text"
                      value={a.title}
                      onChange={(e) => {
                        const copy = [...actionItems];
                        copy[i] = { ...a, title: e.target.value };
                        setActionItems(copy);
                      }}
                      style={inputStyle}
                      placeholder="Title"
                    />
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <input
                        type="text"
                        placeholder="Owner"
                        value={a.owner ?? ""}
                        onChange={(e) => {
                          const copy = [...actionItems];
                          copy[i] = { ...a, owner: e.target.value || null, ownerInferred: false };
                          setActionItems(copy);
                        }}
                        style={{ ...inputStyle, flex: 1, minWidth: 120 }}
                      />
                      <InferredTag inferred={a.ownerInferred} />
                      <input
                        type="date"
                        value={a.dueDate ?? ""}
                        onChange={(e) => {
                          const copy = [...actionItems];
                          copy[i] = { ...a, dueDate: e.target.value || null, dueDateInferred: false };
                          setActionItems(copy);
                        }}
                        style={inputStyle}
                      />
                      <InferredTag inferred={a.dueDateInferred} />
                      <select
                        value={a.status}
                        onChange={(e) => {
                          const copy = [...actionItems];
                          copy[i] = { ...a, status: e.target.value as ActionItem["status"] };
                          setActionItems(copy);
                        }}
                        style={inputStyle}
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In progress</option>
                        <option value="DONE">Done</option>
                      </select>
                      <button
                        type="button"
                        style={smallBtnStyle}
                        onClick={() => setActionItems(actionItems.filter((_, idx) => idx !== i))}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p style={{ margin: 0 }}>
                      <strong>{a.title}</strong>
                      <ConfidenceBadge confidence={a.confidence} />
                    </p>
                    <p className="muted" style={{ fontSize: 13, margin: "4px 0 0" }}>
                      Owner: {a.owner ?? "Unassigned"}
                      <InferredTag inferred={a.ownerInferred} /> &middot; Due:{" "}
                      {a.dueDate ?? "Not specified"}
                      <InferredTag inferred={a.dueDateInferred} /> &middot; Status: {a.status}
                    </p>
                  </>
                )}
              </div>
            ))}
            {isEditable && (
              <button
                type="button"
                style={{ ...smallBtnStyle, marginTop: 8 }}
                onClick={() =>
                  setActionItems([
                    ...actionItems,
                    {
                      id: makeId("action"),
                      title: "",
                      description: null,
                      owner: null,
                      dueDate: null,
                      status: "OPEN",
                      dependencies: [],
                      evidence: { excerpt: "Added during review", sourceType: "USER_CONTEXT" },
                      confidence: 1,
                      ownerInferred: false,
                      dueDateInferred: false,
                      confirmedByUser: true,
                    },
                  ])
                }
              >
                + Add action item
              </button>
            )}
          </div>
        )}

        {activeTab === "Risks & Blockers" && (
          <div>
            {risksAndBlockers.length === 0 && <p className="muted">No risks or blockers.</p>}
            {risksAndBlockers.map((r, i) => (
              <div key={r.id} style={{ borderBottom: "1px solid #ececec", padding: "12px 0" }}>
                {isEditable ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 560 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <select
                        value={r.type}
                        onChange={(e) => {
                          const copy = [...risksAndBlockers];
                          copy[i] = { ...r, type: e.target.value as RiskOrBlocker["type"] };
                          setRisksAndBlockers(copy);
                        }}
                        style={inputStyle}
                      >
                        <option value="RISK">Risk</option>
                        <option value="BLOCKER">Blocker</option>
                      </select>
                      <select
                        value={r.impact}
                        onChange={(e) => {
                          const copy = [...risksAndBlockers];
                          copy[i] = { ...r, impact: e.target.value as RiskOrBlocker["impact"] };
                          setRisksAndBlockers(copy);
                        }}
                        style={inputStyle}
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                      <button
                        type="button"
                        style={smallBtnStyle}
                        onClick={() => setRisksAndBlockers(risksAndBlockers.filter((_, idx) => idx !== i))}
                      >
                        Remove
                      </button>
                    </div>
                    <textarea
                      value={r.description}
                      onChange={(e) => {
                        const copy = [...risksAndBlockers];
                        copy[i] = { ...r, description: e.target.value };
                        setRisksAndBlockers(copy);
                      }}
                      rows={2}
                      style={inputStyle}
                      placeholder="Description"
                    />
                    <input
                      type="text"
                      value={r.mitigation ?? ""}
                      onChange={(e) => {
                        const copy = [...risksAndBlockers];
                        copy[i] = { ...r, mitigation: e.target.value || null };
                        setRisksAndBlockers(copy);
                      }}
                      style={inputStyle}
                      placeholder="Suggested mitigation (optional)"
                    />
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "Open Questions" && (
          <div>
            {openQuestions.length === 0 && <p className="muted">No open questions.</p>}
            {openQuestions.map((q, i) => (
              <div key={q.id} style={{ borderBottom: "1px solid #ececec", padding: "12px 0" }}>
                {isEditable ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 560 }}>
                    <textarea
                      value={q.question}
                      onChange={(e) => {
                        const copy = [...openQuestions];
                        copy[i] = { ...q, question: e.target.value };
                        setOpenQuestions(copy);
                      }}
                      rows={2}
                      style={inputStyle}
                    />
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="text"
                        placeholder="Suggested owner (optional)"
                        value={q.suggestedOwner ?? ""}
                        onChange={(e) => {
                          const copy = [...openQuestions];
                          copy[i] = { ...q, suggestedOwner: e.target.value || null };
                          setOpenQuestions(copy);
                        }}
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <button
                        type="button"
                        style={smallBtnStyle}
                        onClick={() => setOpenQuestions(openQuestions.filter((_, idx) => idx !== i))}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p style={{ margin: 0 }}>
                      {q.question}
                      <ConfidenceBadge confidence={q.confidence} />
                    </p>
                    <p className="muted" style={{ fontSize: 13, margin: "4px 0 0" }}>
                      Suggested owner: {q.suggestedOwner ?? "Not specified"}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "Follow-Up" && (
          <div>
            {analysis.followUp ? (
              <>
                <p>
                  <strong>Subject:</strong> {analysis.followUp.subject}
                </p>
                <p style={{ whiteSpace: "pre-wrap" }}>{analysis.followUp.body}</p>
              </>
            ) : (
              <p className="muted">
                Not generated yet — the follow-up email is created after this
                draft is reviewed and the graph resumes.
              </p>
            )}
          </div>
        )}

        {activeTab === "Next Agenda" && (
          <div>
            {analysis.nextAgenda ? (
              <>
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
              </>
            ) : (
              <p className="muted">
                Not generated yet — the next-meeting agenda is created after
                this draft is reviewed and the graph resumes.
              </p>
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

      {isEditable && (
        <div style={{ marginTop: 24, borderTop: "1px solid #d9dfd6", paddingTop: 16 }}>
          {resumeError && <p style={{ color: "#b3261e" }}>{resumeError}</p>}
          <button type="button" onClick={handleResume} disabled={resuming}>
            {resuming ? "Resuming..." : "Confirm & Resume"}
          </button>
        </div>
      )}
    </section>
  );
}
