// import { renderToString } from "react-dom/server";
// import { MemoryRouter } from "react-router-dom";
// import { describe, expect, it } from "vitest";
// import { AppShell } from "../components/AppShell";
// import { DashboardPage } from "../pages/DashboardPage";

// describe("web starter shell", () => {
//   it("renders the MeetingOS starter navigation", () => {
//     const html = renderToString(
//       <MemoryRouter>
//         <AppShell>
//           <DashboardPage />
//         </AppShell>
//       </MemoryRouter>
//     );

//     expect(html).toContain("MeetingOS Starter");
//     expect(html).toContain("Dashboard");
//   });
// });
import { renderToString } from "react-dom/server";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "../components/AppShell";
import { DashboardPage } from "../pages/DashboardPage";
import { ReviewWorkspacePage } from "../pages/ReviewWorkspacePage";
import * as analysisApi from "../services/analysisApi";

describe("web starter shell", () => {
  it("renders the MeetingOS starter navigation", () => {
    const html = renderToString(
      <MemoryRouter>
        <AppShell>
          <DashboardPage />
        </AppShell>
      </MemoryRouter>
    );
    expect(html).toContain("MeetingOS");
    expect(html).toContain("Sign In");
  });
});

// Frontend interaction test — verifies a user can actually edit a
// reviewed decision and trigger the resume flow. Backend calls are
// mocked; this test never touches the real API, MongoDB, or OpenRouter.
describe("ReviewWorkspacePage — review interaction", () => {
  const mockRunNeedsReview = {
    _id: "run-1",
    ownerId: "owner-1",
    meetingId: "meeting-1",
    threadId: "thread-1",
    status: "NEEDS_REVIEW" as const,
    requestedModel: "mock",
    actualModel: "mock",
    warnings: [],
    result: {
      analysisRunId: "run-1",
      meetingId: "meeting-1",
      summary: { executiveSummary: "Test summary.", themes: ["Test theme"], outcome: "PARTIAL_OUTCOME" as const },
      decisions: [
        {
          id: "decision-1",
          statement: "Original decision statement.",
          owner: null,
          evidence: { excerpt: "Original evidence.", sourceType: "TRANSCRIPT" as const },
          confidence: 0.8,
          inferred: false,
        },
      ],
      actionItems: [],
      risksAndBlockers: [],
      openQuestions: [],
      warnings: [],
      agentRuns: [],
      generatedAt: new Date().toISOString(),
    },
    startedAt: new Date().toISOString(),
  };

  const mockRunFinalized = {
    ...mockRunNeedsReview,
    status: "FINALIZED" as const,
    result: {
      ...mockRunNeedsReview.result,
      followUp: { subject: "Test follow-up subject", body: "Test follow-up body." },
      nextAgenda: {
        title: "Test agenda",
        objectives: [],
        items: [],
        requiredPreparation: [],
        suggestedAttendees: [],
        suggestedDurationMinutes: 30,
      },
    },
  };

  function renderReviewPage() {
    return render(
      <MemoryRouter initialEntries={["/meetings/meeting-1/review?runId=run-1"]}>
        <Routes>
          <Route path="/meetings/:meetingId/review" element={<ReviewWorkspacePage />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it("lets the user edit a decision and resume the analysis", async () => {
    const user = userEvent.setup();

    vi.spyOn(analysisApi, "getAnalysisStatus").mockResolvedValue(mockRunNeedsReview as any);
    const resumeSpy = vi
      .spyOn(analysisApi, "resumeAnalysis")
      .mockResolvedValue(mockRunFinalized as any);

    renderReviewPage();

    await waitFor(() => {
      expect(screen.getByText(/awaiting your review/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Decisions" }));

    const statementField = await screen.findByDisplayValue("Original decision statement.");
    expect(statementField).toBeInTheDocument();

    const ownerField = screen.getByPlaceholderText(/owner \(leave blank if unknown\)/i);
    await user.type(ownerField, "Maya");
    expect(ownerField).toHaveValue("Maya");

    await user.click(screen.getByRole("button", { name: /confirm & resume/i }));

    await waitFor(() => {
      expect(resumeSpy).toHaveBeenCalledWith(
        "meeting-1",
        "run-1",
        expect.objectContaining({
          decisions: [expect.objectContaining({ owner: "Maya" })],
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test follow-up subject")).toBeInTheDocument();
    });
  });
});