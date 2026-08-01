import request from "supertest";
import { describe, expect, it, beforeAll } from "vitest";
import mongoose from "mongoose";
import { createApp } from "../app";
import { getEnv } from "../config/env";

const env = getEnv();
const app = createApp();

function uniqueEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(env.MONGODB_URI);
  }
});

describe("auth", () => {
  it("registers a new user and returns a token", async () => {
    const email = uniqueEmail();
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test User", email, password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("rejects duplicate registration with the same email", async () => {
    const email = uniqueEmail();
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Test User", email, password: "password123" });

    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test User", email, password: "password123" });

    expect(res.status).toBe(409);
    expect(res.body.ok).toBe(false);
  });

  it("logs in with correct credentials", async () => {
    const email = uniqueEmail();
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Test User", email, password: "password123" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it("rejects login with the wrong password", async () => {
    const email = uniqueEmail();
    await request(app)
      .post("/api/auth/register")
      .send({ name: "Test User", email, password: "password123" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });
});

describe("meeting creation and ownership", () => {
  async function registerAndLogin() {
    const email = uniqueEmail();
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test User", email, password: "password123" });
    return res.body.token as string;
  }

  it("rejects meeting creation with no token", async () => {
    const res = await request(app)
      .post("/api/meetings")
      .send({
        title: "Test Meeting",
        meetingType: "PROJECT",
        meetingDate: "2026-07-29",
        transcript: "a".repeat(250),
      });

    expect(res.status).toBe(401);
  });

  it("creates a meeting when authenticated", async () => {
    const token = await registerAndLogin();

    const res = await request(app)
      .post("/api/meetings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Test Meeting",
        meetingType: "PROJECT",
        meetingDate: "2026-07-29",
        transcript: "a".repeat(250),
      });

    expect(res.status).toBe(201);
    expect(res.body.meeting.title).toBe("Test Meeting");
    expect(res.body.meeting.ownerId).toBeTruthy();
  });

  it("returns 404 for a meeting that does not exist", async () => {
    const token = await registerAndLogin();

    const res = await request(app)
      .get("/api/meetings/000000000000000000000000")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("MEETING_NOT_FOUND");
  });

  it("returns 403 when a different user tries to access someone else's meeting", async () => {
    const ownerToken = await registerAndLogin();
    const createRes = await request(app)
      .post("/api/meetings")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        title: "Owner Only Meeting",
        meetingType: "PROJECT",
        meetingDate: "2026-07-29",
        transcript: "a".repeat(250),
      });
    const meetingId = createRes.body.meeting._id;

    const otherToken = await registerAndLogin();
    const res = await request(app)
      .get(`/api/meetings/${meetingId}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("MEETING_FORBIDDEN");
  });

  it("rejects a transcript that is too short", async () => {
    const token = await registerAndLogin();

    const res = await request(app)
      .post("/api/meetings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Test Meeting",
        meetingType: "PROJECT",
        meetingDate: "2026-07-29",
        transcript: "too short",
      });

    expect(res.status).toBe(400);
  });
});