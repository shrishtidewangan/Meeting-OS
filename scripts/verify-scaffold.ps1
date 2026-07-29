$ErrorActionPreference = "Stop"

$requiredPaths = @(
  "README.md",
  "WORK_LOG.md",
  ".env.example",
  "package.json",
  "pnpm-workspace.yaml",
  "docs/assignment/PROJECT_SPEC.md",
  "docs/assignment/INTERN_ASSIGNMENT.md",
  "docs/assignment/OPENROUTER_LANGGRAPH_GUIDE.md",
  "apps/web/src/App.tsx",
  "apps/web/src/pages/AuthPage.tsx",
  "apps/web/src/pages/DashboardPage.tsx",
  "apps/web/src/pages/NewMeetingPage.tsx",
  "apps/web/src/pages/AnalysisProgressPage.tsx",
  "apps/web/src/pages/ReviewWorkspacePage.tsx",
  "apps/web/src/pages/MeetingDetailsPage.tsx",
  "apps/api/src/routes/health.routes.ts",
  "apps/api/src/graph/README.md",
  "apps/api/src/model-client/MeetingModelClient.ts",
  "packages/contracts/src/index.ts",
  "packages/test-fixtures/transcripts/project-meeting.md",
  "packages/test-fixtures/mock-results/success.analysis.json",
  ".github/PULL_REQUEST_TEMPLATE.md"
)

$missing = @()
foreach ($path in $requiredPaths) {
  if (-not (Test-Path -LiteralPath $path)) {
    $missing += $path
  }
}

if ($missing.Count -gt 0) {
  Write-Error ("Missing scaffold paths:`n" + ($missing -join "`n"))
}

$envExample = Get-Content -Raw -LiteralPath ".env.example"
if ($envExample -notmatch "AI_MODE=mock") {
  Write-Error ".env.example must default to AI_MODE=mock"
}

if ($envExample -notmatch "OPENROUTER_MODEL=openrouter/free") {
  Write-Error ".env.example must include OPENROUTER_MODEL=openrouter/free"
}

if (Test-Path -LiteralPath ".env") {
  Write-Error "Do not keep a real .env in the starter repository"
}

Write-Host "MeetingOS scaffold verification passed."

