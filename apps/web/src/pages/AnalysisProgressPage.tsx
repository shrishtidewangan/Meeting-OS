import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { getAnalysisStatus, type AnalysisRun, type AnalysisRunStatus } from "../services/analysisApi";

const NODE_ORDER = [
  { key: "summaryAgent", label: "Summary Agent" },
  { key: "decisionAgent", label: "Decision Agent" },
  { key: "actionAgent", label: "Action Agent" },
  { key: "riskAgent", label: "Risk Agent" },
  { key: "followUpAgent", label: "Follow-Up Agent" },
  { key: "planningAgent", label: "Planning Agent" },
] as const;

const statusColors: Record<string, string> = {
  SUCCEEDED: "bg-green-700",
  FAILED: "bg-red-700",
  FALLBACK: "bg-amber-700",
  RUNNING: "bg-blue-700",
  PENDING: "bg-gray-400",
};

const runStatusColors: Record<AnalysisRunStatus, string> = {
  QUEUED: "bg-gray-500",
  RUNNING: "bg-blue-700",
  NEEDS_REVIEW: "bg-amber-600",
  PARTIAL_FAILURE: "bg-orange-700",
  FINALIZED: "bg-green-700",
  FAILED: "bg-red-700",
};

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
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-600">Loading analysis progress...</p>
      </section>
    );
  }

  if (error && !run) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-bold">Analysis Progress</h1>
        <p className="mt-2 text-sm text-red-700">{error}</p>
        {meetingId && (
          <Link to={`/meetings/${meetingId}`} className="font-semibold text-teal-800 hover:underline">
            Back to meeting
          </Link>
        )}
      </section>
    );
  }

  if (!run) return null;

  const nodeStatusByName = new Map(run.agentRuns?.map((r) => [r.nodeName, r]) ?? []);
  const isSettled = SETTLED_STATUSES.includes(run.status);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Analysis Progress</h1>
        {meetingId && (
          <Link to={`/meetings/${meetingId}`} className="font-semibold text-teal-800 hover:underline">
            Back to meeting
          </Link>
        )}
      </div>

      <p className="mt-1 text-sm text-gray-600">
        Elapsed: {formatElapsed(run.startedAt, run.completedAt)}
        {!isSettled && " (updating every 2s...)"}
      </p>

      <div className="mt-4">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${runStatusColors[run.status]}`}
        >
          {run.status.replace(/_/g, " ")}
        </span>
      </div>

      <h2 className="mb-2 mt-6 text-sm font-semibold">Agent Node Status</h2>
      <div className="flex flex-col gap-2">
        {NODE_ORDER.map(({ key, label }) => {
          const nodeRun = nodeStatusByName.get(key);
          const status = nodeRun?.status ?? "PENDING";
          return (
            <div
              key={key}
              className="flex items-center justify-between rounded border border-gray-100 px-3 py-2"
            >
              <span className="text-sm">{label}</span>
              <span className="flex items-center gap-3">
                {nodeRun?.durationMs !== undefined && (
                  <span className="text-xs text-gray-500">{nodeRun.durationMs}ms</span>
                )}
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${
                    statusColors[status] ?? statusColors.PENDING
                  }`}
                >
                  {status}
                </span>
              </span>
            </div>
          );
        })}
      </div>

      {run.warnings && run.warnings.length > 0 && (
        <div className="mt-5 rounded border border-red-200 bg-red-50 p-3">
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

      {run.status === "NEEDS_REVIEW" && meetingId && (
        <div className="mt-6 border-t border-gray-200 pt-4">
          <Link to={`/meetings/${meetingId}/review?runId=${run._id}`}>
            <button
              type="button"
              className="rounded bg-teal-800 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900"
            >
              Go to Review Workspace
            </button>
          </Link>
        </div>
      )}

      {run.status === "FAILED" && (
        <p className="mt-5 text-sm text-red-700">
          This analysis run failed and did not reach human review.
        </p>
      )}
    </section>
  );
}