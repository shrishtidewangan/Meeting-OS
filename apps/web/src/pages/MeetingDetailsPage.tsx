// export function MeetingDetailsPage() {
//   return (
//     <section className="panel">
//       <h1>Meeting Details Shell</h1>
//       <p className="muted">TODO: display the finalized meeting record, copy actions, metadata, and delete confirmation.</p>
//       <ul className="todo-list">
//         <li>Reviewed record.</li>
//         <li>Follow-up email.</li>
//         <li>Next-meeting agenda.</li>
//         <li>Analysis metadata.</li>
//       </ul>
//     </section>
//   );
// }

import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getMeeting, type Meeting } from "../services/meetingApi";
import { startAnalysis, type MockScenario } from "../services/analysisApi";

export function MeetingDetailsPage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scenario, setScenario] = useState<MockScenario>("success");
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
      const run = await startAnalysis(meetingId, scenario);
      navigate(`/meetings/${meetingId}/review?runId=${run._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start analysis");
    } finally {
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <section className="panel">
        <p className="muted">Loading meeting...</p>
      </section>
    );
  }

  if (error && !meeting) {
    return (
      <section className="panel">
        <h1>Meeting Details</h1>
        <p style={{ color: "#b3261e" }}>{error}</p>
        <Link to="/dashboard">Back to dashboard</Link>
      </section>
    );
  }

  if (!meeting) return null;

  return (
    <section className="panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>{meeting.title}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {meeting.meetingType.replace("_", " ")} &middot;{" "}
            {new Date(meeting.meetingDate).toLocaleDateString()} &middot; Status: {meeting.status}
          </p>
        </div>
        <Link to="/dashboard">Back to dashboard</Link>
      </div>

      {meeting.participants.length > 0 && (
        <p style={{ marginTop: 16 }}>
          <strong>Participants:</strong> {meeting.participants.map((p) => p.name).join(", ")}
        </p>
      )}

      <div style={{ marginTop: 16 }}>
        <strong>Transcript</strong>
        <p
          className="muted"
          style={{
            maxHeight: 160,
            overflowY: "auto",
            whiteSpace: "pre-wrap",
            border: "1px solid #d9dfd6",
            borderRadius: 6,
            padding: 12,
            marginTop: 6,
          }}
        >
          {meeting.transcript}
        </p>
      </div>

      <div style={{ marginTop: 24, borderTop: "1px solid #d9dfd6", paddingTop: 20 }}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Run Analysis (Mock)</h2>
        <p className="muted" style={{ fontSize: 13 }}>
          Live OpenRouter analysis isn't implemented yet — this runs against a
          fixed mock scenario so the review workspace can be built and tested first.
        </p>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value as MockScenario)}
            style={{ padding: 8 }}
          >
            <option value="success">Success</option>
            <option value="partial-failure">Partial failure</option>
            <option value="timeout">Timeout</option>
            <option value="malformed-output">Malformed output</option>
          </select>
          <button type="button" onClick={handleRunAnalysis} disabled={starting}>
            {starting ? "Starting..." : "Run Mock Analysis"}
          </button>
        </div>
        {error && <p style={{ color: "#b3261e", marginTop: 8 }}>{error}</p>}
      </div>
    </section>
  );
}