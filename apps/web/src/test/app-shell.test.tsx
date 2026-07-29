import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AppShell } from "../components/AppShell";
import { DashboardPage } from "../pages/DashboardPage";

describe("web starter shell", () => {
  it("renders the MeetingOS starter navigation", () => {
    const html = renderToString(
      <MemoryRouter>
        <AppShell>
          <DashboardPage />
        </AppShell>
      </MemoryRouter>
    );

    expect(html).toContain("MeetingOS Starter");
    expect(html).toContain("Dashboard");
  });
});
