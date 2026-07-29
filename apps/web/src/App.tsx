import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { AnalysisProgressPage } from "./pages/AnalysisProgressPage";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { MeetingDetailsPage } from "./pages/MeetingDetailsPage";
import { NewMeetingPage } from "./pages/NewMeetingPage";
import { ReviewWorkspacePage } from "./pages/ReviewWorkspacePage";
import { RunDetailsPage } from "./pages/RunDetailsPage";

export function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/meetings/new" element={<NewMeetingPage />} />
          <Route path="/meetings/:meetingId/analysis" element={<AnalysisProgressPage />} />
          <Route path="/meetings/:meetingId/review" element={<ReviewWorkspacePage />} />
          <Route path="/meetings/:meetingId" element={<MeetingDetailsPage />} />
          <Route path="/runs/:analysisRunId" element={<RunDetailsPage />} />
          <Route
            path="*"
            element={
              <section className="panel">
                <h1>MeetingOS Starter</h1>
                <p>This route is not part of the scaffold.</p>
                <Link to="/dashboard">Return to dashboard shell</Link>
              </section>
            }
          />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

