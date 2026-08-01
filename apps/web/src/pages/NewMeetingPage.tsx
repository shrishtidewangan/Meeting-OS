import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { createMeeting } from "../services/meetingApi";
import type { MeetingType } from "@meetingos/contracts";

const MIN_TRANSCRIPT = 200;
const MAX_TRANSCRIPT = 60000;

type FormValues = {
  title: string;
  meetingType: MeetingType;
  meetingDate: string;
  participantsInput: string;
  projectOrAccountName: string;
  context: string;
  desiredOutcome: string;
  transcript: string;
};

export function NewMeetingPage() {
  const navigate = useNavigate();
  const [inputMode, setInputMode] = useState<"paste" | "upload">("paste");
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      title: "",
      meetingType: "PROJECT",
      meetingDate: "",
      participantsInput: "",
      projectOrAccountName: "",
      context: "",
      desiredOutcome: "",
      transcript: "",
    },
  });

  const transcript = watch("transcript");

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
      setValue("transcript", String(reader.result ?? ""), { shouldValidate: true });
    };
    reader.onerror = () => {
      setFileError("Could not read that file.");
    };
    reader.readAsText(file);
  }

  async function onSubmit(values: FormValues) {
    setFormError(null);

    const participants = values.participantsInput
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({ name }));

    try {
      const meeting = await createMeeting({
        title: values.title.trim(),
        meetingType: values.meetingType,
        meetingDate: values.meetingDate,
        transcript: values.transcript,
        participants: participants.length > 0 ? participants : undefined,
        projectOrAccountName: values.projectOrAccountName.trim() || undefined,
        context: values.context.trim() || undefined,
        desiredOutcome: values.desiredOutcome.trim() || undefined,
      });
      navigate(`/meetings/${meeting._id}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create meeting");
    }
  }

  const charCountColor =
    transcript.length > 0 && (transcript.length < MIN_TRANSCRIPT || transcript.length > MAX_TRANSCRIPT)
      ? "text-red-700"
      : "text-gray-600";

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6">
      <h1 className="mb-4 text-xl font-bold">New Meeting</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-xl flex-col gap-4">
        <label className="text-sm font-medium">
          Title
          <input
            type="text"
            {...register("title", {
              required: "Title is required",
              minLength: { value: 3, message: "Title must be at least 3 characters" },
              maxLength: { value: 120, message: "Title must be at most 120 characters" },
            })}
            className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm focus:border-teal-700 focus:outline-none"
          />
          {errors.title && <p className="mt-1 text-xs text-red-700">{errors.title.message}</p>}
        </label>

        <div className="flex gap-4">
          <label className="flex-1 text-sm font-medium">
            Meeting date
            <input
              type="date"
              {...register("meetingDate", { required: "Meeting date is required" })}
              className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm focus:border-teal-700 focus:outline-none"
            />
            {errors.meetingDate && (
              <p className="mt-1 text-xs text-red-700">{errors.meetingDate.message}</p>
            )}
          </label>

          <label className="flex-1 text-sm font-medium">
            Meeting type
            <select
              {...register("meetingType")}
              className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm focus:border-teal-700 focus:outline-none"
            >
              <option value="PROJECT">Project meeting</option>
              <option value="CUSTOMER_INTERVIEW">Customer interview</option>
              <option value="SALES_CALL">Sales call</option>
              <option value="TEAM_STANDUP">Team stand-up</option>
            </select>
          </label>
        </div>

        <label className="text-sm font-medium">
          Participants <span className="font-normal text-gray-500">(comma-separated, optional)</span>
          <input
            type="text"
            {...register("participantsInput")}
            placeholder="Ana, Ben, Chris"
            className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm focus:border-teal-700 focus:outline-none"
          />
        </label>

        <label className="text-sm font-medium">
          Project or account name <span className="font-normal text-gray-500">(optional)</span>
          <input
            type="text"
            {...register("projectOrAccountName")}
            className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm focus:border-teal-700 focus:outline-none"
          />
        </label>

        <label className="text-sm font-medium">
          Context <span className="font-normal text-gray-500">(optional)</span>
          <textarea
            {...register("context")}
            rows={2}
            className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm focus:border-teal-700 focus:outline-none"
          />
        </label>

        <label className="text-sm font-medium">
          Desired outcome <span className="font-normal text-gray-500">(optional)</span>
          <textarea
            {...register("desiredOutcome")}
            rows={2}
            className="mt-1 block w-full rounded border border-gray-300 p-2 text-sm focus:border-teal-700 focus:outline-none"
          />
        </label>

        <div>
          <div className="mb-2 flex gap-4 text-sm">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                checked={inputMode === "paste"}
                onChange={() => setInputMode("paste")}
              />
              Paste transcript
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                checked={inputMode === "upload"}
                onChange={() => setInputMode("upload")}
              />
              Upload .txt or .md
            </label>
          </div>

          {inputMode === "paste" ? (
            <textarea
              {...register("transcript", {
                required: "Transcript is required",
                minLength: { value: MIN_TRANSCRIPT, message: `Transcript too short (minimum ${MIN_TRANSCRIPT} characters)` },
                maxLength: { value: MAX_TRANSCRIPT, message: `Transcript too long (maximum ${MAX_TRANSCRIPT} characters)` },
              })}
              rows={10}
              placeholder="Paste the meeting transcript or notes here..."
              className="block w-full rounded border border-gray-300 p-2 text-sm focus:border-teal-700 focus:outline-none"
            />
          ) : (
            <div>
              <input type="file" accept=".txt,.md" onChange={handleFileChange} className="text-sm" />
              {fileError && <p className="mt-1 text-xs text-red-700">{fileError}</p>}
              {transcript && (
                <textarea
                  {...register("transcript", {
                    required: "Transcript is required",
                    minLength: { value: MIN_TRANSCRIPT, message: `Transcript too short (minimum ${MIN_TRANSCRIPT} characters)` },
                    maxLength: { value: MAX_TRANSCRIPT, message: `Transcript too long (maximum ${MAX_TRANSCRIPT} characters)` },
                  })}
                  rows={10}
                  className="mt-2 block w-full rounded border border-gray-300 p-2 text-sm focus:border-teal-700 focus:outline-none"
                />
              )}
            </div>
          )}

          {errors.transcript && (
            <p className="mt-1 text-xs text-red-700">{errors.transcript.message}</p>
          )}

          <p className={`mt-1 text-xs ${charCountColor}`}>
            {transcript.length.toLocaleString()} / {MAX_TRANSCRIPT.toLocaleString()} characters
            {transcript.length > 0 && transcript.length < MIN_TRANSCRIPT ? ` (minimum ${MIN_TRANSCRIPT})` : ""}
          </p>
        </div>

        {formError && <p className="text-sm text-red-700">{formError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-teal-800 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-60"
        >
          {isSubmitting ? "Creating..." : "Create Meeting"}
        </button>

        <p className="text-xs text-gray-500">
          Note: this creates the meeting record and starts the LangGraph analysis automatically.
        </p>
      </form>
    </section>
  );
}