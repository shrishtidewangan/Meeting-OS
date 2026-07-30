// export function DashboardPage() {
//   return (
//     <section className="panel">
//       <h1>Meeting Dashboard Shell</h1>
//       <p className="muted">TODO: list owned meetings, filters, statuses, action counts, and empty states.</p>
//       <ul className="todo-list">
//         <li>Recent meetings.</li>
//         <li>Meeting type and status filters.</li>
//         <li>Open action-item count.</li>
//         <li>New meeting entry point.</li>
//       </ul>
//     </section>
//   );
// }

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { listMeetings, type Meeting } from "../services/meetingApi";
import { getToken } from "../services/apiClient";
import type { MeetingType, MeetingStatus } from "@meetingos/contracts";

const statusColors: Record<MeetingStatus, string> = {
  DRAFT: "#8a8f89",
  QUEUED: "#8a7a3a",
  RUNNING: "#2f6f9e",
  PARTIAL_FAILURE: "#b3701e",
  NEEDS_REVIEW: "#a3852c",
  FINALIZED: "#2e7d4f",
  FAILED: "#b3261e",
};

export function DashboardPage() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<MeetingType | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<MeetingStatus | "ALL">("ALL");

  useEffect(() => {
    if (!getToken()) {
      navigate("/auth");
      return;
    }

    listMeetings()
      .then(setMeetings)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load meetings"))
      .finally(() => setLoading(false));
  }, [navigate]);

  const filtered = meetings.filter((meeting) => {
    const matchesSearch = meeting.title.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "ALL" || meeting.meetingType === typeFilter;
    const matchesStatus = statusFilter === "ALL" || meeting.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) {
    return (
      <section className="panel">
        <p className="muted">Loading meetings...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel">
        <h1>Meeting Dashboard</h1>
        <p style={{ color: "#b3261e" }}>{error}</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Meeting Dashboard</h1>
        <Link to="/meetings/new">
          <button type="button">New meeting</button>
        </Link>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: 8, flex: "1 1 200px" }}
        />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as MeetingType | "ALL")} style={{ padding: 8 }}>
          <option value="ALL">All types</option>
          <option value="PROJECT">Project</option>
          <option value="CUSTOMER_INTERVIEW">Customer interview</option>
          <option value="SALES_CALL">Sales call</option>
          <option value="TEAM_STANDUP">Team stand-up</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as MeetingStatus | "ALL")} style={{ padding: 8 }}>
          <option value="ALL">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="QUEUED">Queued</option>
          <option value="RUNNING">Running</option>
          <option value="PARTIAL_FAILURE">Partial failure</option>
          <option value="NEEDS_REVIEW">Needs review</option>
          <option value="FINALIZED">Finalized</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="muted" style={{ textAlign: "center", padding: "40px 0" }}>
          {meetings.length === 0 ? (
            <>
              <p>No meetings yet.</p>
              <Link to="/meetings/new">Create your first meeting</Link>
            </>
          ) : (
            <p>No meetings match your search or filters.</p>
          )}
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #d9dfd6" }}>
              <th style={{ padding: "8px 4px" }}>Title</th>
              <th style={{ padding: "8px 4px" }}>Type</th>
              <th style={{ padding: "8px 4px" }}>Status</th>
              <th style={{ padding: "8px 4px" }}>Date</th>
              <th style={{ padding: "8px 4px" }}>Participants</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((meeting) => (
              <tr key={meeting._id} style={{ borderBottom: "1px solid #ececec" }}>
                <td style={{ padding: "10px 4px" }}>
                  <Link to={`/meetings/${meeting._id}`}>{meeting.title}</Link>
                </td>
                <td style={{ padding: "10px 4px" }}>{meeting.meetingType.replace("_", " ")}</td>
                <td style={{ padding: "10px 4px" }}>
                  <span
                    style={{
                      color: "#fff",
                      background: statusColors[meeting.status],
                      padding: "2px 10px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 650,
                    }}
                  >
                    {meeting.status.replace("_", " ")}
                  </span>
                </td>
                <td style={{ padding: "10px 4px" }}>
                  {new Date(meeting.meetingDate).toLocaleDateString()}
                </td>
                <td style={{ padding: "10px 4px" }}>{meeting.participants.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
