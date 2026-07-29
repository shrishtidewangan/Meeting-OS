import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app";

describe("api starter health route", () => {
  it("returns scaffold health information", async () => {
    const response = await request(createApp()).get("/health").expect(200);

    expect(response.body).toEqual({
      ok: true,
      service: "meetingos-api",
      scaffold: true
    });
  });
});

