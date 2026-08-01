import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getMeeting, type Meeting } from "../services/meetingApi";
import { startAnalysis } from "../services/analysisApi";

export function MeetingDetailsPage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!meetingId) return;
    getMeeting(meetingId)
      .then(setMeeting)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load meeting"))
      .finally(() => setLoading(false));
  }, [meetingId]);

  async function handleRunAnalysis() {
    if (!meetingId) return;
    setError(null);
    setStarting(true);
    try {
      const run = await startAnalysis(meetingId);
      // Go through the Analysis Progress page first, not straight to
      // Review — this page shows per-node status and has its own
      // "Go to Review Workspace" button once the run reaches NEEDS_REVIEW.
      navigate(`/meetings/${meetingId}/analysis?runId=${run._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start analysis");
    } finally {
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-600">Loading meeting...</p>
      </section>
    );
  }

  if (error && !meeting) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-bold">Meeting Details</h1>
        <p className="text-sm text-red-700">{error}</p>
        <Link to="/dashboard" className="font-semibold text-teal-800 hover:underline">
          Back to dashboard
        </Link>
      </section>
    );
  }

  if (!meeting) return null;

  const isFinalized = meeting.status === "FINALIZED";

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="mb-1 text-xl font-bold">{meeting.title}</h1>
          <p className="m-0 text-sm text-gray-600">
            {meeting.meetingType.replace("_", " ")} &middot;{" "}
            {new Date(meeting.meetingDate).toLocaleDateString()} &middot; Status: {meeting.status}
          </p>
        </div>
        <Link to="/dashboard" className="font-semibold text-teal-800 hover:underline">
          Back to dashboard
        </Link>
      </div>

      {meeting.participants.length > 0 && (
        <p className="mt-4 text-sm">
          <strong>Participants:</strong> {meeting.participants.map((p) => p.name).join(", ")}
        </p>
      )}

      <div className="mt-4">
        <strong className="text-sm">Transcript</strong>
        <p className="mt-1.5 max-h-40 overflow-y-auto whitespace-pre-wrap rounded border border-gray-200 p-3 text-sm text-gray-600">
          {meeting.transcript}
        </p>
      </div>

      {isFinalized && meeting.followUpEmail && (
        <div className="mt-6 rounded border border-green-200 bg-green-50 p-4">
          <h2 className="mb-2 text-base font-semibold">Follow-Up Email</h2>
          <p className="text-sm">
            <strong>Subject:</strong> {meeting.followUpEmail.subject}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm">
            {meeting.followUpEmail.body}
          </p>
        </div>
      )}

      {isFinalized && meeting.nextAgenda && (
        <div className="mt-4 rounded border border-blue-200 bg-blue-50 p-4">
          <h2 className="mb-2 text-base font-semibold">Next Meeting Agenda</h2>
          <p className="text-sm font-semibold">{meeting.nextAgenda.title}</p>
          <p className="text-sm text-gray-600">
            Suggested duration: {meeting.nextAgenda.suggestedDurationMinutes} minutes
          </p>
        </div>
      )}

      {!isFinalized && (
        <div className="mt-6 border-t border-gray-200 pt-5">
          <h2 className="mb-1 text-base font-semibold">Run Analysis</h2>
          <p className="mb-3 text-xs text-gray-600">
            Starts the LangGraph analysis pipeline (mock mode) for this meeting.
          </p>
          <button
            type="button"
            onClick={handleRunAnalysis}
            disabled={starting}
            className="rounded bg-teal-800 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-60"
          >
            {starting ? "Starting..." : "Run Analysis"}
          </button>
          {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        </div>
      )}
    </section>
  );
}