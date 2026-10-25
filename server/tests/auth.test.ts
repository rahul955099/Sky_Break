import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../src/db.js";
import { app, createAdmin, login, PASSWORD, resetDb } from "./helpers.js";

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("authentication", () => {
  it("rejects wrong credentials and unknown users with the same response", async () => {
    await createAdmin("OWNER", "owner@test.local");
    const wrong = await request(app).post("/api/auth/login").send({ email: "owner@test.local", password: "nope" });
    const unknown = await request(app).post("/api/auth/login").send({ email: "ghost@test.local", password: "nope" });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body).toEqual(unknown.body);
  });

  it("issues an httpOnly SameSite=Strict session cookie and stores only a token hash", async () => {
    await createAdmin("OWNER", "owner@test.local");
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "OWNER@test.local", password: PASSWORD })
      .expect(200);
    const cookie = String(res.headers["set-cookie"]);
    expect(cookie).toMatch(/sb_session=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Strict/i);
    expect(res.body.data.user).toMatchObject({ email: "owner@test.local", role: "OWNER" });
    expect(res.body.data.user.passwordHash).toBeUndefined();

    const token = /sb_session=([^;]+)/.exec(cookie)![1]!;
    const session = await prisma.session.findFirstOrThrow();
    expect(session.tokenHash).not.toBe(token);
    expect(session.tokenHash).toHaveLength(64);
  });

  it("rejects disabled accounts", async () => {
    const user = await createAdmin("ADMIN", "disabled@test.local");
    await prisma.adminUser.update({ where: { id: user.id }, data: { isActive: false } });
    await request(app).post("/api/auth/login").send({ email: "disabled@test.local", password: PASSWORD }).expect(401);
  });

  it("returns the current user from /me and signs out on logout", async () => {
    await createAdmin("OWNER", "owner@test.local");
    const { agent, csrf } = await login("owner@test.local");
    const me = await agent.get("/api/auth/me").expect(200);
    expect(me.body.data.user.email).toBe("owner@test.local");
    expect(me.body.data.csrfToken).toBe(csrf);

    await agent.post("/api/auth/logout").expect(403); // missing CSRF token
    await agent.post("/api/auth/logout").set("X-CSRF-Token", csrf).expect(204);
    await agent.get("/api/auth/me").expect(401);
    expect(await prisma.session.count()).toBe(0);
  });

  it("rejects expired sessions", async () => {
    await createAdmin("OWNER", "owner@test.local");
    const { agent } = await login("owner@test.local");
    await prisma.session.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    await agent.get("/api/auth/me").expect(401);
  });

  it("validates the login body", async () => {
    await request(app).post("/api/auth/login").send({ email: "nope" }).expect(422);
  });
});

describe("admin route protection", () => {
  const protectedRoutes: [string, string][] = [
    ["get", "/api/admin/dashboard"],
    ["get", "/api/admin/projects"],
    ["post", "/api/admin/projects"],
    ["get", "/api/admin/services"],
    ["get", "/api/admin/enquiries"],
    ["get", "/api/admin/enquiries/export"],
    ["patch", "/api/admin/enquiries/abc"],
    ["get", "/api/admin/settings"],
    ["put", "/api/admin/settings"],
    ["post", "/api/admin/uploads"],
  ];

  it.each(protectedRoutes)("%s %s returns 401 without a session", async (method, path) => {
    const res = await (request(app) as unknown as Record<string, (p: string) => request.Test>)[method]!(path);
    expect(res.status).toBe(401);
  });

  it("rejects a forged session cookie", async () => {
    await request(app).get("/api/admin/dashboard").set("Cookie", "sb_session=forged-token-value-1234567890").expect(401);
  });

  it("requires a CSRF token for state-changing admin requests", async () => {
    await createAdmin("OWNER", "owner@test.local");
    const { agent } = await login("owner@test.local");
    const res = await agent.put("/api/admin/settings").send({ companyName: "X Co", tagline: "Tag line" }).expect(403);
    expect(res.body.error.code).toBe("CSRF_INVALID");
    await agent.put("/api/admin/settings").set("X-CSRF-Token", "wrong").send({}).expect(403);
  });

  it("enforces roles: editors cannot access enquiries, settings or delete content", async () => {
    await createAdmin("EDITOR", "editor@test.local");
    const { agent, csrf } = await login("editor@test.local");
    await agent.get("/api/admin/dashboard").expect(200);
    await agent.get("/api/admin/projects").expect(200);
    await agent.get("/api/admin/enquiries").expect(403);
    await agent.get("/api/admin/settings").expect(403);
    await agent.delete("/api/admin/projects/some-id").set("X-CSRF-Token", csrf).expect(403);
  });
});
