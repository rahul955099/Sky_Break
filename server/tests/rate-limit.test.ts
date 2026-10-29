import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../src/db.js";
import { app, createAdmin, resetDb, validEnquiry } from "./helpers.js";

beforeAll(() => {
  process.env.ENABLE_RATE_LIMIT_IN_TESTS = "true";
});
beforeEach(resetDb);
afterAll(async () => {
  delete process.env.ENABLE_RATE_LIMIT_IN_TESTS;
  await prisma.$disconnect();
});

describe("rate limiting", () => {
  it("limits enquiry submissions per client", async () => {
    // Distinct emails/mobiles so the per-contact limits don't trigger before the IP limiter.
    const unique = (i: number) => ({ ...validEnquiry(), email: `person${i}@example.com`, phone: `98450123${40 + i}` });
    for (let i = 0; i < 5; i++) await request(app).post("/api/enquiries").send(unique(i)).expect(201);
    const blocked = await request(app).post("/api/enquiries").send(unique(9)).expect(429);
    expect(blocked.body.error.code).toBe("RATE_LIMITED");
  });

  it("limits failed login attempts", async () => {
    await createAdmin("OWNER", "owner@test.local");
    for (let i = 0; i < 10; i++) {
      await request(app).post("/api/auth/login").send({ email: "owner@test.local", password: "wrong" }).expect(401);
    }
    await request(app).post("/api/auth/login").send({ email: "owner@test.local", password: "wrong" }).expect(429);
  });
});
