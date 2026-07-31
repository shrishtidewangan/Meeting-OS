// export function AnalysisProgressPage() {
//   return (
//     <section className="panel">
//       <h1>Analysis Progress Shell</h1>
//       <p className="muted">TODO: show graph status, node progress, elapsed time, warnings, and retry affordances.</p>
//       <ul className="todo-list">
//         <li>Overall run status.</li>
//         <li>Summary, Decision, Action, Risk, Follow-Up, and Planning node states.</li>
//         <li>Partial failure warnings.</li>
//         <li>Link into the review workspace when the graph interrupts.</li>
//       </ul>
//     </section>
//   );
// }

import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { getAnalysisStatus, type AnalysisRun, type AnalysisRunStatus } from "../services/analysisApi";

// All six agent nodes, in the order the graph runs them. followUpAgent and
// planningAgent only get an entry in agentRuns AFTER human review/resume,
// so they show as PENDING until then — this is expected, not a bug.
const NODE_ORDER = [
  { key: "summaryAgent", label: "Summary Agent" },
  { key: "decisionAgent", label: "Decision Agent" },
  { key: "actionAgent", label: "Action Agent" },
  { key: "riskAgent", label: "Risk Agent" },
  { key: "followUpAgent", label: "Follow-Up Agent" },
  { key: "planningAgent", label: "Planning Agent" },
] as const;

const statusColors: Record<string, string> = {
  SUCCEEDED: "#2e7d4f",
  FAILED: "#b3261e",
  FALLBACK: "#a3852c",
  RUNNING: "#2f6f9e",
  PENDING: "#8a8f89",
};

const runStatusColors: Record<AnalysisRunStatus, string> = {
  QUEUED: "#8a8f89",
  RUNNING: "#2f6f9e",
  NEEDS_REVIEW: "#a3852c",
  PARTIAL_FAILURE: "#b3701e",
  FINALIZED: "#2e7d4f",
  FAILED: "#b3261e",
};

// A run is "settled" once it's reached a state that won't change on its
// own without a human action (review, resume, or retry) — safe to stop polling.
const SETTLED_STATUSES: AnalysisRunStatus[] = ["NEEDS_REVIEW", "PARTIAL_FAILURE", "FINALIZED", "FAILED"];

function formatElapsed(startedAt: string, completedAt?: string) {
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const seconds = Math.max(0, Math.round((end - start) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
}

export function AnalysisProgressPage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const [searchParams] = useSearchParams();
  const runId = searchParams.get("runId");

  const [run, setRun] = useState<AnalysisRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!meetingId || !runId) {
      setError("No analysis run specified. Start an analysis from the meeting details page first.");
      setLoading(false);
      return;
    }

    async function poll() {
      try {
        const result = await getAnalysisStatus(meetingId!, runId!);
        setRun(result);
        setError(null);

        // Stop polling once the run has settled — no need to keep hitting
        // the API for a state that won't change without a human action.
        if (SETTLED_STATUSES.includes(result.status) && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load analysis status");
      } finally {
        setLoading(false);
      }
    }

    poll();
    intervalRef.current = setInterval(poll, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [meetingId, runId]);

  if (loading && !run) {
    return (
      <section className="panel">
        <p className="muted">Loading analysis progress...</p>
      </section>
    );
  }

  if (error && !run) {
    return (
      <section className="panel">
        <h1>Analysis Progress</h1>
        <p style={{ color: "#b3261e" }}>{error}</p>
        {meetingId && <Link to={`/meetings/${meetingId}`}>Back to meeting</Link>}
      </section>
    );
  }

  if (!run) return null;

  const nodeStatusByName = new Map(run.agentRuns?.map((r) => [r.nodeName, r]) ?? []);
  const isSettled = SETTLED_STATUSES.includes(run.status);

  return (
    <section className="panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Analysis Progress</h1>
        {meetingId && <Link to={`/meetings/${meetingId}`}>Back to meeting</Link>}
      </div>

      <p className="muted" style={{ marginTop: 4 }}>
        Elapsed: {formatElapsed(run.startedAt, run.completedAt)}
        {!isSettled && " (updating every 2s...)"}
      </p>

      <div style={{ marginTop: 16 }}>
        <span
          style={{
            color: "#fff",
            background: runStatusColors[run.status],
            padding: "4px 12px",
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 650,
          }}
        >
          {run.status.replace(/_/g, " ")}
        </span>
      </div>

      <h2 style={{ fontSize: 15, marginTop: 24, marginBottom: 8 }}>Agent Node Status</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {NODE_ORDER.map(({ key, label }) => {
          const nodeRun = nodeStatusByName.get(key);
          const status = nodeRun?.status ?? "PENDING";
          return (
            <div
              key={key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                border: "1px solid #ececec",
                borderRadius: 6,
              }}
            >
              <span>{label}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {nodeRun?.durationMs !== undefined && (
                  <span className="muted" style={{ fontSize: 12 }}>{nodeRun.durationMs}ms</span>
                )}
                <span
                  style={{
                    color: "#fff",
                    background: statusColors[status] ?? statusColors.PENDING,
                    padding: "2px 10px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 650,
                  }}
                >
                  {status}
                </span>
              </span>
            </div>
          );
        })}
      </div>

      {run.warnings && run.warnings.length > 0 && (
        <div style={{ background: "#fdecea", border: "1px solid #f3b7b0", borderRadius: 6, padding: 12, marginTop: 20 }}>
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

      {run.status === "NEEDS_REVIEW" && meetingId && (
        <div style={{ marginTop: 24, borderTop: "1px solid #d9dfd6", paddingTop: 16 }}>
          <Link to={`/meetings/${meetingId}/review?runId=${run._id}`}>
            <button type="button">Go to Review Workspace</button>
          </Link>
        </div>
      )}

      {run.status === "FAILED" && (
        <p style={{ color: "#b3261e", marginTop: 20 }}>
          This analysis run failed and did not reach human review.
        </p>
      )}
    </section>
  );
}