import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../src/db.js";
import { app, resetDb, seedProject, validEnquiry } from "./helpers.js";

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("POST /api/enquiries", () => {
  it("saves a valid enquiry and reports that email delivery is unavailable", async () => {
    const res = await request(app).post("/api/enquiries").send(validEnquiry()).expect(201);
    expect(res.body.data).toMatchObject({ emailNotified: false, duplicate: false });
    const saved = await prisma.enquiry.findUniqueOrThrow({ where: { id: res.body.data.id } });
    expect(saved).toMatchObject({ email: "person@example.com", status: "NEW", budgetRange: null, consent: true });
    expect(saved.ipHash).toMatch(/^[a-f0-9]{32}$/);
  });

  it("links the enquiry to a project when a project slug is supplied", async () => {
    const project = await seedProject({ slug: "linked-project" });
    const res = await request(app)
      .post("/api/enquiries")
      .send({ ...validEnquiry(), projectSlug: "linked-project" })
      .expect(201);
    const saved = await prisma.enquiry.findUniqueOrThrow({ where: { id: res.body.data.id } });
    expect(saved.projectId).toBe(project.id);
  });

  it("returns field-level validation errors", async () => {
    const res = await request(app)
      .post("/api/enquiries")
      .send({ ...validEnquiry(), email: "not-an-email", phone: "abc", message: "short", projectType: "Castle" })
      .expect(422);
    const paths = res.body.error.details.map((d: { path: string }) => d.path);
    expect(paths).toEqual(expect.arrayContaining(["email", "phone", "message", "projectType"]));
    expect(await prisma.enquiry.count()).toBe(0);
  });

  it("requires consent", async () => {
    await request(app).post("/api/enquiries").send({ ...validEnquiry(), consent: false }).expect(422);
  });

  it("rejects honeypot and too-fast submissions", async () => {
    await request(app).post("/api/enquiries").send({ ...validEnquiry(), website: "http://spam" }).expect(422);
    await request(app).post("/api/enquiries").send({ ...validEnquiry(), formStartedAt: Date.now() }).expect(400);
    expect(await prisma.enquiry.count()).toBe(0);
  });

  it("is idempotent for repeated submissions with the same clientSubmissionId", async () => {
    const payload = { ...validEnquiry(), clientSubmissionId: randomUUID() };
    const first = await request(app).post("/api/enquiries").send(payload).expect(201);
    const second = await request(app).post("/api/enquiries").send(payload).expect(200);
    expect(second.body.data).toMatchObject({ id: first.body.data.id, duplicate: true });
    expect(await prisma.enquiry.count()).toBe(1);
  });

  it("rejects oversized request bodies", async () => {
    const res = await request(app)
      .post("/api/enquiries")
      .send({ ...validEnquiry(), message: "x".repeat(300_000) });
    expect(res.status).toBe(413);
  });
});
