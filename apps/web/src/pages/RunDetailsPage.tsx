import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getAnalysisRunById, type AnalysisRun } from "../services/analysisApi";

const statusColors: Record<string, string> = {
  QUEUED: "bg-gray-500",
  RUNNING: "bg-blue-700",
  NEEDS_REVIEW: "bg-amber-600",
  PARTIAL_FAILURE: "bg-orange-700",
  FINALIZED: "bg-green-700",
  FAILED: "bg-red-700",
};

const nodeStatusColors: Record<string, string> = {
  SUCCEEDED: "bg-green-700",
  FAILED: "bg-red-700",
  FALLBACK: "bg-amber-700",
  RUNNING: "bg-blue-700",
  PENDING: "bg-gray-400",
};

export function RunDetailsPage() {
  const { analysisRunId } = useParams<{ analysisRunId: string }>();
  const [run, setRun] = useState<AnalysisRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!analysisRunId) {
      setError("No analysis run ID specified.");
      setLoading(false);
      return;
    }
    getAnalysisRunById(analysisRunId)
      .then(setRun)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load run details"))
      .finally(() => setLoading(false));
  }, [analysisRunId]);

  if (loading) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-600">Loading run details...</p>
      </section>
    );
  }

  if (error || !run) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-bold">Run Details</h1>
        <p className="mt-2 text-sm text-red-700">{error ?? "Run not found."}</p>
      </section>
    );
  }

  const durationMs = run.completedAt
    ? new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()
    : undefined;

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Run Details</h1>
        <Link to={`/meetings/${run.meetingId}`} className="font-semibold text-teal-800 hover:underline">
          Back to meeting
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${
            statusColors[run.status] ?? "bg-gray-500"
          }`}
        >
          {run.status.replace(/_/g, " ")}
        </span>
        <span className="text-gray-600">Analysis Run ID: {run._id}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs text-gray-500">Requested model</p>
          <p className="font-medium">{run.requestedModel}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Actual model</p>
          <p className="font-medium">{run.actualModel ?? "n/a"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Duration</p>
          <p className="font-medium">{durationMs !== undefined ? `${durationMs}ms` : "In progress"}</p>
        </div>
      </div>

      <h2 className="mt-6 mb-2 text-sm font-semibold">Node Status</h2>
      <div className="flex flex-col gap-1.5">
        {(run.agentRuns ?? []).map((nodeRun) => (
          <div
            key={nodeRun.nodeName}
            className="flex items-center justify-between rounded border border-gray-100 px-3 py-2 text-sm"
          >
            <span>{nodeRun.nodeName}</span>
            <span className="flex items-center gap-3">
              {nodeRun.durationMs !== undefined && (
                <span className="text-xs text-gray-500">{nodeRun.durationMs}ms</span>
              )}
              {nodeRun.retryCount > 0 && (
                <span className="text-xs text-amber-700">retried {nodeRun.retryCount}x</span>
              )}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold text-white ${
                  nodeStatusColors[nodeRun.status] ?? "bg-gray-400"
                }`}
              >
                {nodeRun.status}
              </span>
            </span>
          </div>
        ))}
      </div>

      {run.warnings.length > 0 && (
        <>
          <h2 className="mt-6 mb-2 text-sm font-semibold">Warnings</h2>
          <ul className="ml-4 list-disc text-sm text-red-700">
            {run.warnings.map((w, i) => (
              <li key={i}>
                {w.message} {w.nodeName && <span className="text-gray-500">({w.nodeName})</span>}
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-6 text-xs text-gray-500">
        No transcript, prompts, API keys, or reasoning traces are shown here — only sanitized
        run/node metadata.
      </p>
    </section>
  );
}

