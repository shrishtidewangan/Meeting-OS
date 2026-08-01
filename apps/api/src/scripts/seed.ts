import mongoose from "mongoose";
import bcrypt from "bcrypt";
import fs from "node:fs";
import path from "node:path";
import { getEnv } from "../config/env";
import { User } from "../models/user.model";
import { Meeting } from "../models/meeting.model";

const env = getEnv();
const FIXTURES_DIR = path.resolve(process.cwd(), "../../packages/test-fixtures/transcripts");

async function ensureDemoUser() {
  const email = "demo@meetingos.local";
  let user = await User.findOne({ email });
  if (!user) {
    const passwordHash = await bcrypt.hash("password123", 10);
    user = await User.create({ name: "Demo User", email, passwordHash });
    console.log(`Created demo user: ${email} / password123`);
  } else {
    console.log(`Demo user already exists: ${email}`);
  }
  return user;
}

async function seedMeeting(ownerId: string, filename: string, meetingType: string, title: string) {
  const filePath = path.join(FIXTURES_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${title} — fixture file not found: ${filename}`);
    return;
  }

  const transcript = fs.readFileSync(filePath, "utf-8");
  const existing = await Meeting.findOne({ ownerId, title });
  if (existing) {
    console.log(`Meeting already seeded: ${title}`);
    return;
  }

  await Meeting.create({
    ownerId,
    title,
    meetingType,
    meetingDate: new Date(),
    transcript,
    participants: [],
  });
  console.log(`Seeded meeting: ${title}`);
}

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  const user = await ensureDemoUser();

  await seedMeeting(user._id.toString(), "project-meeting.md", "PROJECT", "Project Meeting Fixture");
  await seedMeeting(user._id.toString(), "customer-interview.md", "CUSTOMER_INTERVIEW", "Customer Interview Fixture");
  await seedMeeting(user._id.toString(), "team-standup.md", "TEAM_STANDUP", "Team Standup Fixture");

  console.log("Seeding complete. Log in as demo@meetingos.local / password123.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});