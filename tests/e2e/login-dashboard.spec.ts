import { test, expect } from "@playwright/test";

// REQUIRES both servers running locally before these tests execute:
//   pnpm --filter api dev   (with MongoDB running, AI_MODE=mock)
//   pnpm --filter web dev
//
// Neither test calls live OpenRouter — both use the mock analysis path,
// per spec requirement ("Tests must not call OpenRouter").

test("user can log in and reach their dashboard", async ({ page }) => {
  await page.goto("/auth");

  await page.getByLabel("Email").fill("test4@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Meeting Dashboard" })).toBeVisible();
});

test("full happy path: create meeting, run analysis, edit, resume", async ({ page }) => {
  // 1. Sign in
  await page.goto("/auth");
  await page.getByLabel("Email").fill("test4@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  // 2. Create a new meeting
  await page.getByRole("main").getByRole("link", { name: "New meeting" }).click();
  await expect(page).toHaveURL(/\/meetings\/new/);

  const uniqueTitle = `E2E Test Meeting ${Date.now()}`;
  await page.getByLabel("Title").fill(uniqueTitle);
  await page.getByLabel("Meeting date").fill("2026-07-29");
  await page
    .getByPlaceholder("Paste the meeting transcript or notes here...")
    .fill(
      "This is an automated end-to-end test transcript with enough characters to pass the two hundred character minimum length requirement enforced by the backend validation for meeting transcripts in this system."
    );
  await page.getByRole("button", { name: "Create Meeting" }).click();

  // 3. Should land on the meeting details page
  await expect(page).toHaveURL(/\/meetings\/[a-f0-9]+$/);
  await expect(page.getByRole("heading", { name: uniqueTitle })).toBeVisible();

  // 4. Trigger mock analysis (default "Success" scenario)
 // 4. Trigger analysis (mock mode, real LangGraph pipeline)
  await page.getByRole("button", { name: "Run Analysis" }).click();

  // 5. Should land on the Analysis Progress page first
  await expect(page).toHaveURL(/\/analysis\?runId=/);
  await expect(page.getByRole("heading", { name: "Analysis Progress" })).toBeVisible();

  // Click through to Review Workspace once the run reaches NEEDS_REVIEW
  await page.getByRole("button", { name: "Go to Review Workspace" }).click();
  await expect(page).toHaveURL(/\/review\?runId=/);
  await expect(page.getByText(/awaiting your review/i)).toBeVisible();

  // 6. Edit a decision's owner field
  await page.getByRole("button", { name: "Decisions" }).click();
  const ownerField = page.getByPlaceholder(/owner \(leave blank if unknown\)/i).first();
  await ownerField.fill("E2E Test Owner");

  // 7. Confirm & Resume
  await page.getByRole("button", { name: "Confirm & Resume" }).click();

  
  // 8. Should now show the finalized run with real follow-up content
  await expect(page.getByLabel("Subject")).toBeVisible({ timeout: 10000 });
  await expect(page.getByLabel("Subject")).not.toHaveValue("");
  await expect(page.getByText("FINALIZED")).toBeVisible();
});