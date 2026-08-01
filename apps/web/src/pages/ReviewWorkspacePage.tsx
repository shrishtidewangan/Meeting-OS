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
  const color = confidence >= 0.8 ? "text-green-700" : confidence >= 0.5 ? "text-amber-700" : "text-red-700";
  return <span className={`ml-2 text-xs font-semibold ${color}`}>{pct}% confidence</span>;
}

function InferredTag({ inferred }: { inferred: boolean }) {
  if (!inferred) return null;
  return (
    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-800">
      INFERRED
    </span>
  );
}

const inputClass =
  "rounded border border-gray-300 p-1.5 text-sm focus:border-teal-700 focus:outline-none";
const smallBtnClass =
  "rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium hover:bg-gray-50";

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

type SummaryState = {
  executiveSummary: string;
  themes: string[];
  outcome: "CLEAR_OUTCOME" | "PARTIAL_OUTCOME" | "NO_CLEAR_OUTCOME";
};

type AgendaState = {
  title: string;
  objectives: string[];
  items: string[];
  requiredPreparation: string[];
  suggestedAttendees: string[];
  suggestedDurationMinutes: number;
};

export function ReviewWorkspacePage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const [searchParams] = useSearchParams();
  const runId = searchParams.get("runId");

  const [run, setRun] = useState<AnalysisRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  const [summary, setSummary] = useState<SummaryState>({
    executiveSummary: "",
    themes: [],
    outcome: "PARTIAL_OUTCOME",
  });
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [risksAndBlockers, setRisksAndBlockers] = useState<RiskOrBlocker[]>([]);
  const [openQuestions, setOpenQuestions] = useState<OpenQuestion[]>([]);

  // Local-only editable copies of the generated follow-up/agenda — there is
  // no backend endpoint to persist edits to an already-finalized record, so
  // these exist for the user to tweak wording before copying elsewhere,
  // not to save back to the database.
  const [followUpDraft, setFollowUpDraft] = useState({ subject: "", body: "" });
  const [agendaDraft, setAgendaDraft] = useState<AgendaState>({
    title: "",
    objectives: [],
    items: [],
    requiredPreparation: [],
    suggestedAttendees: [],
    suggestedDurationMinutes: 30,
  });
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

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
          setSummary(result.result.summary);
          setDecisions(result.result.decisions ?? []);
          setActionItems(result.result.actionItems ?? []);
          setRisksAndBlockers(result.result.risksAndBlockers ?? []);
          setOpenQuestions(result.result.openQuestions ?? []);
          if (result.result.followUp) {
            setFollowUpDraft(result.result.followUp);
          }
          if (result.result.nextAgenda) {
            setAgendaDraft(result.result.nextAgenda);
          }
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
      const updatedRun = await resumeAnalysis(meetingId, runId, {
        summary,
        decisions,
        actionItems: actionItems.map((a) => ({ ...a, confirmedByUser: true })),
        risksAndBlockers,
        openQuestions,
      });
      setRun(updatedRun);
      if (updatedRun.result?.followUp) {
        setFollowUpDraft(updatedRun.result.followUp);
      }
      if (updatedRun.result?.nextAgenda) {
        setAgendaDraft(updatedRun.result.nextAgenda);
      }
      setActiveTab("Follow-Up");
    } catch (err) {
      setResumeError(err instanceof Error ? err.message : "Failed to resume analysis");
    } finally {
      setResuming(false);
    }
  }

  async function handleCopyFollowUp() {
    const text = `Subject: ${followUpDraft.subject}\n\n${followUpDraft.body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("Copied!");
      setTimeout(() => setCopyStatus(null), 2000);
    } catch {
      setCopyStatus("Could not copy — please select and copy manually.");
    }
  }

  if (loading) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-600">Loading analysis...</p>
      </section>
    );
  }

  if (error || !run) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-bold">Review Workspace</h1>
        <p className="text-sm text-red-700">{error ?? "Analysis not found."}</p>
        {meetingId && (
          <Link to={`/meetings/${meetingId}`} className="font-semibold text-teal-800 hover:underline">
            Back to meeting
          </Link>
        )}
      </section>
    );
  }

  const analysis = run.result;

  if (!analysis) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-bold">Review Workspace</h1>
        <p className="text-sm text-gray-600">
          This run has status <strong>{run.status}</strong> but no result is available yet.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Review Workspace</h1>
        <Link to={`/meetings/${meetingId}`} className="font-semibold text-teal-800 hover:underline">
          Back to meeting
        </Link>
      </div>
      <p className="mt-1 text-sm text-gray-600">
        Run status: <strong>{run.status}</strong> &middot; Generated{" "}
        {new Date(analysis.generatedAt).toLocaleString()}
      </p>

      {isEditable && (
        <div className="mt-3 rounded border border-green-200 bg-green-50 p-3 text-sm">
          This draft is awaiting your review. Edit the summary, decisions, action items,
          risks, and open questions below, then click <strong>Confirm &amp; Resume</strong> to
          generate the follow-up email and next-meeting agenda from your reviewed data.
        </div>
      )}

      {run.warnings.length > 0 && (
        <div className="mt-3 rounded border border-red-200 bg-red-50 p-3">
          <strong className="text-sm text-red-700">Warnings</strong>
          <ul className="ml-4 mt-1.5 list-disc text-sm">
            {run.warnings.map((w, i) => (
              <li key={i}>
                {w.message} {w.nodeName && <span className="text-gray-500">({w.nodeName})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <nav className="mt-5 flex flex-wrap gap-1 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-3.5 py-2 text-sm ${
              activeTab === tab
                ? "border-teal-800 font-bold text-gray-900"
                : "border-transparent font-medium text-gray-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="pt-5">
        {activeTab === "Overview" && (
          <div>
            {isEditable ? (
              <div className="flex max-w-xl flex-col gap-3">
                <label className="text-sm font-medium">
                  Executive summary
                  <textarea
                    value={summary.executiveSummary}
                    onChange={(e) => setSummary({ ...summary, executiveSummary: e.target.value })}
                    rows={4}
                    className={`mt-1 block w-full ${inputClass}`}
                  />
                </label>
                <label className="text-sm font-medium">
                  Outcome
                  <select
                    value={summary.outcome}
                    onChange={(e) =>
                      setSummary({ ...summary, outcome: e.target.value as SummaryState["outcome"] })
                    }
                    className={`mt-1 block ${inputClass}`}
                  >
                    <option value="CLEAR_OUTCOME">Clear outcome</option>
                    <option value="PARTIAL_OUTCOME">Partial outcome</option>
                    <option value="NO_CLEAR_OUTCOME">No clear outcome</option>
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Themes <span className="font-normal text-gray-500">(comma-separated)</span>
                  <input
                    type="text"
                    value={summary.themes.join(", ")}
                    onChange={(e) =>
                      setSummary({
                        ...summary,
                        themes: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                      })
                    }
                    className={`mt-1 block w-full ${inputClass}`}
                  />
                </label>
              </div>
            ) : (
              <>
                <p className="text-sm">{analysis.summary.executiveSummary}</p>
                <p className="mt-2 text-sm">
                  <strong>Outcome:</strong> {analysis.summary.outcome.replace(/_/g, " ")}
                </p>
                <p className="mt-2 text-sm">
                  <strong>Themes:</strong> {analysis.summary.themes.join(", ")}
                </p>
              </>
            )}
          </div>
        )}

        {activeTab === "Decisions" && (
          <div>
            {decisions.length === 0 && <p className="text-sm text-gray-600">No decisions.</p>}
            {decisions.map((d, i) => (
              <div key={d.id} className="border-b border-gray-100 py-3">
                {isEditable ? (
                  <div className="flex max-w-xl flex-col gap-1.5">
                    <textarea
                      value={d.statement}
                      onChange={(e) => {
                        const copy = [...decisions];
                        copy[i] = { ...d, statement: e.target.value };
                        setDecisions(copy);
                      }}
                      rows={2}
                      className={inputClass}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Owner (leave blank if unknown)"
                        value={d.owner ?? ""}
                        onChange={(e) => {
                          const copy = [...decisions];
                          copy[i] = { ...d, owner: e.target.value || null, inferred: false };
                          setDecisions(copy);
                        }}
                        className={`flex-1 ${inputClass}`}
                      />
                      <InferredTag inferred={d.inferred} />
                      <button
                        type="button"
                        className={smallBtnClass}
                        onClick={() => setDecisions(decisions.filter((_, idx) => idx !== i))}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm">
                      {d.statement}
                      <ConfidenceBadge confidence={d.confidence} />
                      <InferredTag inferred={d.inferred} />
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      Owner: {d.owner ?? "Not specified"} &middot; Evidence: "{d.evidence.excerpt}"
                    </p>
                  </>
                )}
              </div>
            ))}
            {isEditable && (
              <button
                type="button"
                className={`mt-2 ${smallBtnClass}`}
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
            {actionItems.length === 0 && <p className="text-sm text-gray-600">No action items.</p>}
            {actionItems.map((a, i) => (
              <div key={a.id} className="border-b border-gray-100 py-3">
                {isEditable ? (
                  <div className="flex max-w-xl flex-col gap-1.5">
                    <input
                      type="text"
                      value={a.title}
                      onChange={(e) => {
                        const copy = [...actionItems];
                        copy[i] = { ...a, title: e.target.value };
                        setActionItems(copy);
                      }}
                      className={inputClass}
                      placeholder="Title"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        placeholder="Owner"
                        value={a.owner ?? ""}
                        onChange={(e) => {
                          const copy = [...actionItems];
                          copy[i] = { ...a, owner: e.target.value || null, ownerInferred: false };
                          setActionItems(copy);
                        }}
                        className={`min-w-32 flex-1 ${inputClass}`}
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
                        className={inputClass}
                      />
                      <InferredTag inferred={a.dueDateInferred} />
                      <select
                        value={a.status}
                        onChange={(e) => {
                          const copy = [...actionItems];
                          copy[i] = { ...a, status: e.target.value as ActionItem["status"] };
                          setActionItems(copy);
                        }}
                        className={inputClass}
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In progress</option>
                        <option value="DONE">Done</option>
                      </select>
                      <button
                        type="button"
                        className={smallBtnClass}
                        onClick={() => setActionItems(actionItems.filter((_, idx) => idx !== i))}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm">
                      <strong>{a.title}</strong>
                      <ConfidenceBadge confidence={a.confidence} />
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
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
                className={`mt-2 ${smallBtnClass}`}
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
            {risksAndBlockers.length === 0 && <p className="text-sm text-gray-600">No risks or blockers.</p>}
            {risksAndBlockers.map((r, i) => (
              <div key={r.id} className="border-b border-gray-100 py-3">
                {isEditable ? (
                  <div className="flex max-w-xl flex-col gap-1.5">
                    <div className="flex gap-2">
                      <select
                        value={r.type}
                        onChange={(e) => {
                          const copy = [...risksAndBlockers];
                          copy[i] = { ...r, type: e.target.value as RiskOrBlocker["type"] };
                          setRisksAndBlockers(copy);
                        }}
                        className={inputClass}
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
                        className={inputClass}
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                      <button
                        type="button"
                        className={smallBtnClass}
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
                      className={inputClass}
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
                      className={inputClass}
                      placeholder="Suggested mitigation (optional)"
                    />
                  </div>
                ) : (
                  <>
                    <p className="text-sm">
                      <strong>{r.type}</strong> &middot; Impact: {r.impact}
                      <ConfidenceBadge confidence={r.confidence} />
                    </p>
                    <p className="mt-1 text-sm">{r.description}</p>
                    {r.mitigation && (
                      <p className="mt-1 text-xs text-gray-600">Suggested mitigation: {r.mitigation}</p>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "Open Questions" && (
          <div>
            {openQuestions.length === 0 && <p className="text-sm text-gray-600">No open questions.</p>}
            {openQuestions.map((q, i) => (
              <div key={q.id} className="border-b border-gray-100 py-3">
                {isEditable ? (
                  <div className="flex max-w-xl flex-col gap-1.5">
                    <textarea
                      value={q.question}
                      onChange={(e) => {
                        const copy = [...openQuestions];
                        copy[i] = { ...q, question: e.target.value };
                        setOpenQuestions(copy);
                      }}
                      rows={2}
                      className={inputClass}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Suggested owner (optional)"
                        value={q.suggestedOwner ?? ""}
                        onChange={(e) => {
                          const copy = [...openQuestions];
                          copy[i] = { ...q, suggestedOwner: e.target.value || null };
                          setOpenQuestions(copy);
                        }}
                        className={`flex-1 ${inputClass}`}
                      />
                      <button
                        type="button"
                        className={smallBtnClass}
                        onClick={() => setOpenQuestions(openQuestions.filter((_, idx) => idx !== i))}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm">
                      {q.question}
                      <ConfidenceBadge confidence={q.confidence} />
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
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
              <div className="flex max-w-xl flex-col gap-3">
                <label className="text-sm font-medium">
                  Subject
                  <input
                    type="text"
                    value={followUpDraft.subject}
                    onChange={(e) => setFollowUpDraft({ ...followUpDraft, subject: e.target.value })}
                    className={`mt-1 block w-full ${inputClass}`}
                  />
                </label>
                <label className="text-sm font-medium">
                  Body
                  <textarea
                    value={followUpDraft.body}
                    onChange={(e) => setFollowUpDraft({ ...followUpDraft, body: e.target.value })}
                    rows={8}
                    className={`mt-1 block w-full ${inputClass}`}
                  />
                </label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={handleCopyFollowUp} className={smallBtnClass}>
                    Copy to clipboard
                  </button>
                  {copyStatus && <span className="text-xs text-gray-600">{copyStatus}</span>}
                </div>
                <p className="text-xs text-gray-500">
                  Edits here are local to this page for copying elsewhere — they are not saved back
                  to the meeting record.
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Not generated yet — the follow-up email is created after this draft is reviewed and
                the graph resumes.
              </p>
            )}
          </div>
        )}

        {activeTab === "Next Agenda" && (
          <div>
            {analysis.nextAgenda ? (
              <div className="flex max-w-xl flex-col gap-3">
                <label className="text-sm font-medium">
                  Title
                  <input
                    type="text"
                    value={agendaDraft.title}
                    onChange={(e) => setAgendaDraft({ ...agendaDraft, title: e.target.value })}
                    className={`mt-1 block w-full ${inputClass}`}
                  />
                </label>
                <label className="text-sm font-medium">
                  Suggested duration (minutes)
                  <input
                    type="number"
                    value={agendaDraft.suggestedDurationMinutes}
                    onChange={(e) =>
                      setAgendaDraft({ ...agendaDraft, suggestedDurationMinutes: Number(e.target.value) })
                    }
                    className={`mt-1 block w-32 ${inputClass}`}
                  />
                </label>
                <label className="text-sm font-medium">
                  Objectives <span className="font-normal text-gray-500">(one per line)</span>
                  <textarea
                    value={agendaDraft.objectives.join("\n")}
                    onChange={(e) =>
                      setAgendaDraft({
                        ...agendaDraft,
                        objectives: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    rows={3}
                    className={`mt-1 block w-full ${inputClass}`}
                  />
                </label>
                <label className="text-sm font-medium">
                  Agenda items <span className="font-normal text-gray-500">(one per line)</span>
                  <textarea
                    value={agendaDraft.items.join("\n")}
                    onChange={(e) =>
                      setAgendaDraft({
                        ...agendaDraft,
                        items: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    rows={4}
                    className={`mt-1 block w-full ${inputClass}`}
                  />
                </label>
                <p className="text-xs text-gray-500">
                  Edits here are local to this page — they are not saved back to the meeting
                  record (no backend endpoint currently persists agenda edits after resume).
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Not generated yet — the next-meeting agenda is created after this draft is
                reviewed and the graph resumes.
              </p>
            )}
          </div>
        )}

        {activeTab === "Run Details" && (
          <div className="text-sm">
            <p>
              <strong>Analysis Run ID:</strong> {analysis.analysisRunId}
            </p>
            <p className="mt-1">
              <strong>Status:</strong> {run.status}
            </p>
            <p className="mt-1">
              <strong>Requested model:</strong> {run.requestedModel} &middot;{" "}
              <strong>Actual model:</strong> {run.actualModel ?? "n/a"}
            </p>
            <p className="mt-1">
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
        <div className="mt-6 border-t border-gray-200 pt-4">
          {resumeError && <p className="mb-2 text-sm text-red-700">{resumeError}</p>}
          <button
            type="button"
            onClick={handleResume}
            disabled={resuming}
            className="rounded bg-teal-800 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-60"
          >
            {resuming ? "Resuming..." : "Confirm & Resume"}
          </button>
        </div>
      )}
    </section>
  );
}