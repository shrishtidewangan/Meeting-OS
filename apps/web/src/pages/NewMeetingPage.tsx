// export function NewMeetingPage() {
//   return (
//     <section className="panel">
//       <h1>New Meeting Shell</h1>
//       <p className="muted">TODO: implement metadata form, transcript paste/upload, validation, and analysis start.</p>
//       <ul className="todo-list">
//         <li>Title, date, meeting type, participants, context.</li>
//         <li>Transcript or notes from paste, txt, or md upload.</li>
//         <li>Character count and validation messages.</li>
//         <li>Analyze Meeting action.</li>
//       </ul>
//     </section>
//   );
// }

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createMeeting } from "../services/meetingApi";
import type { MeetingType } from "@meetingos/contracts";

const MIN_TRANSCRIPT = 200;
const MAX_TRANSCRIPT = 60000;

export function NewMeetingPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [meetingType, setMeetingType] = useState<MeetingType>("PROJECT");
  const [meetingDate, setMeetingDate] = useState("");
  const [participantsInput, setParticipantsInput] = useState("");
  const [projectOrAccountName, setProjectOrAccountName] = useState("");
  const [context, setContext] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");
  const [transcript, setTranscript] = useState("");
  const [inputMode, setInputMode] = useState<"paste" | "upload">("paste");
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (ext !== ".txt" && ext !== ".md") {
      setFileError("Only .txt and .md files are supported.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setTranscript(String(reader.result ?? ""));
    };
    reader.onerror = () => {
      setFileError("Could not read that file.");
    };
    reader.readAsText(file);
  }

  function validate(): string | null {
    if (title.trim().length < 3 || title.trim().length > 120) {
      return "Title must be between 3 and 120 characters.";
    }
    if (!meetingDate) {
      return "Meeting date is required.";
    }
    if (transcript.length < MIN_TRANSCRIPT) {
      return `Transcript too short (minimum ${MIN_TRANSCRIPT} characters, currently ${transcript.length}).`;
    }
    if (transcript.length > MAX_TRANSCRIPT) {
      return `Transcript too long (maximum ${MAX_TRANSCRIPT} characters, currently ${transcript.length}).`;
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const participants = participantsInput
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({ name }));

    setSubmitting(true);
    try {
      const meeting = await createMeeting({
        title: title.trim(),
        meetingType,
        meetingDate,
        transcript,
        participants: participants.length > 0 ? participants : undefined,
        projectOrAccountName: projectOrAccountName.trim() || undefined,
        context: context.trim() || undefined,
        desiredOutcome: desiredOutcome.trim() || undefined,
      });
      navigate(`/meetings/${meeting._id}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create meeting");
    } finally {
      setSubmitting(false);
    }
  }

  const charCountColor =
    transcript.length > 0 && (transcript.length < MIN_TRANSCRIPT || transcript.length > MAX_TRANSCRIPT)
      ? "#b3261e"
      : "#5e6860";

  return (
    <section className="panel">
      <h1>New Meeting</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 560 }}>
        <label>
          Title
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>

        <div style={{ display: "flex", gap: 16 }}>
          <label style={{ flex: 1 }}>
            Meeting date
            <input
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              required
              style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
            />
          </label>

          <label style={{ flex: 1 }}>
            Meeting type
            <select
              value={meetingType}
              onChange={(e) => setMeetingType(e.target.value as MeetingType)}
              style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
            >
              <option value="PROJECT">Project meeting</option>
              <option value="CUSTOMER_INTERVIEW">Customer interview</option>
              <option value="SALES_CALL">Sales call</option>
              <option value="TEAM_STANDUP">Team stand-up</option>
            </select>
          </label>
        </div>

        <label>
          Participants <span className="muted">(comma-separated, optional)</span>
          <input
            type="text"
            value={participantsInput}
            onChange={(e) => setParticipantsInput(e.target.value)}
            placeholder="Ana, Ben, Chris"
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Project or account name <span className="muted">(optional)</span>
          <input
            type="text"
            value={projectOrAccountName}
            onChange={(e) => setProjectOrAccountName(e.target.value)}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Context <span className="muted">(optional)</span>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={2}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Desired outcome <span className="muted">(optional)</span>
          <textarea
            value={desiredOutcome}
            onChange={(e) => setDesiredOutcome(e.target.value)}
            rows={2}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>

        <div>
          <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
            <label>
              <input
                type="radio"
                checked={inputMode === "paste"}
                onChange={() => setInputMode("paste")}
              />{" "}
              Paste transcript
            </label>
            <label>
              <input
                type="radio"
                checked={inputMode === "upload"}
                onChange={() => setInputMode("upload")}
              />{" "}
              Upload .txt or .md
            </label>
          </div>

          {inputMode === "paste" ? (
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={10}
              placeholder="Paste the meeting transcript or notes here..."
              style={{ display: "block", width: "100%", padding: 8 }}
            />
          ) : (
            <div>
              <input type="file" accept=".txt,.md" onChange={handleFileChange} />
              {fileError && <p style={{ color: "#b3261e", marginTop: 4 }}>{fileError}</p>}
              {transcript && (
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  rows={10}
                  style={{ display: "block", width: "100%", padding: 8, marginTop: 8 }}
                />
              )}
            </div>
          )}

          <p style={{ color: charCountColor, fontSize: 13, marginTop: 4 }}>
            {transcript.length.toLocaleString()} / {MAX_TRANSCRIPT.toLocaleString()} characters
            {transcript.length > 0 && transcript.length < MIN_TRANSCRIPT
              ? ` (minimum ${MIN_TRANSCRIPT})`
              : ""}
          </p>
        </div>

        {formError && <p style={{ color: "#b3261e" }}>{formError}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create Meeting"}
        </button>

        <p className="muted" style={{ fontSize: 13 }}>
          Note: this creates the meeting record. Starting the AI analysis is implemented
          in a later step.
        </p>
      </form>
    </section>
  );
}
