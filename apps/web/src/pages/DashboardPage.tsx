import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { listMeetings, type Meeting } from "../services/meetingApi";
import { getToken } from "../services/apiClient";
import type { MeetingType, MeetingStatus } from "@meetingos/contracts";

const statusColors: Record<MeetingStatus, string> = {
  DRAFT: "bg-gray-500",
  QUEUED: "bg-amber-700",
  RUNNING: "bg-blue-700",
  PARTIAL_FAILURE: "bg-orange-700",
  NEEDS_REVIEW: "bg-amber-600",
  FINALIZED: "bg-green-700",
  FAILED: "bg-red-700",
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
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-600">Loading meetings...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-bold">Meeting Dashboard</h1>
        <p className="text-sm text-red-700">{error}</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold">Meeting Dashboard</h1>
        <Link to="/meetings/new">
          <button
            type="button"
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
          >
            New meeting
          </button>
        </Link>
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-48 flex-1 rounded border border-gray-300 p-2 text-sm"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as MeetingType | "ALL")}
          className="rounded border border-gray-300 p-2 text-sm"
        >
          <option value="ALL">All types</option>
          <option value="PROJECT">Project</option>
          <option value="CUSTOMER_INTERVIEW">Customer interview</option>
          <option value="SALES_CALL">Sales call</option>
          <option value="TEAM_STANDUP">Team stand-up</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as MeetingStatus | "ALL")}
          className="rounded border border-gray-300 p-2 text-sm"
        >
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
        <div className="py-10 text-center text-sm text-gray-600">
          {meetings.length === 0 ? (
            <>
              <p>No meetings yet.</p>
              <Link to="/meetings/new" className="font-semibold text-teal-800 hover:underline">
                Create your first meeting
              </Link>
            </>
          ) : (
            <p>No meetings match your search or filters.</p>
          )}
        </div>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              <th className="px-1 py-2">Title</th>
              <th className="px-1 py-2">Type</th>
              <th className="px-1 py-2">Status</th>
              <th className="px-1 py-2">Date</th>
              <th className="px-1 py-2">Participants</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((meeting) => (
              <tr key={meeting._id} className="border-b border-gray-100">
                <td className="px-1 py-2.5">
                  <Link
                    to={`/meetings/${meeting._id}`}
                    className="font-semibold text-teal-800 hover:underline"
                  >
                    {meeting.title}
                  </Link>
                </td>
                <td className="px-1 py-2.5">{meeting.meetingType.replace("_", " ")}</td>
                <td className="px-1 py-2.5">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${statusColors[meeting.status]}`}
                  >
                    {meeting.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-1 py-2.5">
                  {new Date(meeting.meetingDate).toLocaleDateString()}
                </td>
                <td className="px-1 py-2.5">{meeting.participants.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}