import { describe, expect, it } from "vitest";
import { meetingStatuses, meetingTypes } from "./meeting";

describe("contract starter exports", () => {
  it("reserves meeting type and status names", () => {
    expect(meetingTypes).toContain("PROJECT");
    expect(meetingStatuses).toContain("NEEDS_REVIEW");
  });
});

