import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../src/db.js";
import { emailDomainAcceptsMail, isImplausibleMobile, normalizeIndianMobile } from "../src/utils/contact.js";
import { app, resetDb, validEnquiry } from "./helpers.js";

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

const withoutPhone = (over: Record<string, unknown> = {}) => {
  const { phone: _p, ...rest } = validEnquiry();
  return { ...rest, clientSubmissionId: randomUUID(), ...over };
};

async function requestCode(email: string) {
  const res = await request(app).post("/api/enquiries/email-code").send({ email }).expect(200);
  return res.body.data.devCode as string;
}

describe("Indian mobile numbers", () => {
  it.each([
    ["98450 12345", "+919845012345"],
    ["+91 98450-12345", "+919845012345"],
    ["919845012345", "+919845012345"],
    ["09845012345", "+919845012345"],
    ["0091 (984) 501-2345", "+919845012345"],
    ["6123456780", "+916123456780"],
  ])("normalises %s", (input, expected) => {
    expect(normalizeIndianMobile(input)).toBe(expected);
  });

  it.each(["5845012345", "984501234", "98450123456", "+1 555 010 0100", "+44 7700 900123", "abcdefghij", "+919845012345x"])(
    "rejects %s",
    (input) => expect(normalizeIndianMobile(input)).toBeNull(),
  );

  it("flags implausible numbers", () => {
    expect(isImplausibleMobile("+919999999999")).toBe(true);
    expect(isImplausibleMobile("+919876543210")).toBe(true);
    expect(isImplausibleMobile("+916789012345")).toBe(true);
    expect(isImplausibleMobile("+919845012345")).toBe(false);
  });

  it("stores the normalised form and rejects non-Indian or fake numbers", async () => {
    const res = await request(app).post("/api/enquiries").send({ ...validEnquiry(), phone: "098450 12345" }).expect(201);
    const saved = await prisma.enquiry.findUniqueOrThrow({ where: { id: res.body.data.id } });
    expect(saved.phone).toBe("+919845012345");
    expect(saved.emailVerified).toBe(false);

    for (const phone of ["+1 555 0100", "12345", "9999999999"]) {
      const bad = await request(app).post("/api/enquiries").send({ ...validEnquiry(), phone }).expect(422);
      expect(bad.body.error.details.map((d: { path: string }) => d.path)).toContain("phone");
    }
  });
});

describe("email domain check", () => {
  const err = (code: string) => Object.assign(new Error(code), { code });
  const resolver = (mx: () => Promise<{ exchange: string; priority: number }[]>, a: () => Promise<string[]> = async () => []) => ({
    resolveMx: mx,
    resolve4: a,
    resolve6: async () => {
      throw err("ENODATA");
    },
  });

  it("accepts domains with MX records", async () => {
    expect(await emailDomainAcceptsMail("a@mx-ok.test", resolver(async () => [{ exchange: "mail.mx-ok.test", priority: 10 }]))).toBe(true);
  });
  it("rejects null-MX and non-existent domains", async () => {
    expect(await emailDomainAcceptsMail("a@null-mx.test", resolver(async () => [{ exchange: ".", priority: 0 }]))).toBe(false);
    expect(
      await emailDomainAcceptsMail("a@missing.test", resolver(async () => { throw err("ENOTFOUND"); }, async () => { throw err("ENOTFOUND"); })),
    ).toBe(false);
  });
  it("falls back to an address record when there is no MX", async () => {
    expect(await emailDomainAcceptsMail("a@a-only.test", resolver(async () => { throw err("ENODATA"); }, async () => ["192.0.2.1"]))).toBe(true);
  });
  it("fails open on resolver errors so customers are never blocked by DNS outages", async () => {
    expect(await emailDomainAcceptsMail("a@flaky.test", resolver(async () => { throw err("ESERVFAIL"); }))).toBe(true);
  });
});

describe("email verification when no mobile number is given", () => {
  it("requires either a mobile number or an email code", async () => {
    const res = await request(app).post("/api/enquiries").send(withoutPhone()).expect(422);
    expect(res.body.error.details.map((d: { path: string }) => d.path)).toContain("emailCode");
  });

  it("issues a code, accepts it once, and marks the enquiry as email-verified", async () => {
    const email = "person@example.com";
    const code = await requestCode(email);
    expect(code).toMatch(/^\d{6}$/);
    const stored = await prisma.emailVerification.findFirstOrThrow({ where: { email } });
    expect(stored.codeHash).not.toContain(code);

    const ok = await request(app).post("/api/enquiries").send(withoutPhone({ emailCode: code })).expect(201);
    const saved = await prisma.enquiry.findUniqueOrThrow({ where: { id: ok.body.data.id } });
    expect(saved).toMatchObject({ phone: null, emailVerified: true, email });

    // Single use
    await request(app).post("/api/enquiries").send(withoutPhone({ emailCode: code })).expect(422);
  });

  it("counts wrong attempts and locks the code after five", async () => {
    const code = await requestCode("person@example.com");
    const wrong = code === "000000" ? "111111" : "000000";
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post("/api/enquiries").send(withoutPhone({ emailCode: wrong })).expect(422);
      expect(res.body.error.details[0].path).toBe("emailCode");
    }
    const locked = await request(app).post("/api/enquiries").send(withoutPhone({ emailCode: code })).expect(422);
    expect(locked.body.error.message).toMatch(/too many incorrect attempts/i);
  });

  it("rejects expired codes", async () => {
    const code = await requestCode("person@example.com");
    await prisma.emailVerification.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    const res = await request(app).post("/api/enquiries").send(withoutPhone({ emailCode: code })).expect(422);
    expect(res.body.error.message).toMatch(/expired/i);
  });

  it("enforces a resend cooldown and only the newest code is valid", async () => {
    const first = await requestCode("person@example.com");
    const again = await request(app).post("/api/enquiries/email-code").send({ email: "person@example.com" }).expect(429);
    expect(again.body.error.code).toBe("CODE_COOLDOWN");
    expect(again.body.error.details.retryAfter).toBeGreaterThan(0);

    await prisma.emailVerification.updateMany({ data: { createdAt: new Date(Date.now() - 120_000) } });
    const second = await requestCode("person@example.com");
    if (first !== second) await request(app).post("/api/enquiries").send(withoutPhone({ emailCode: first })).expect(422);
    await request(app).post("/api/enquiries").send(withoutPhone({ emailCode: second })).expect(201);
  });

  it("validates the email before sending a code", async () => {
    await request(app).post("/api/enquiries/email-code").send({ email: "not-an-email" }).expect(422);
  });
});

describe("enquiry limits per email and per mobile", () => {
  const submit = (over: Record<string, unknown>) =>
    request(app).post("/api/enquiries").send({ ...validEnquiry(), clientSubmissionId: randomUUID(), ...over });

  it("applies the default limit of 3 per email address", async () => {
    for (let i = 0; i < 3; i++) await submit({ phone: `98450123${40 + i}` }).expect(201);
    const res = await submit({ phone: "9845012399" }).expect(429);
    expect(res.body.error.code).toBe("ENQUIRY_LIMIT");
    expect(res.body.error.details[0].path).toBe("email");
  });

  it("applies the limit per mobile number across different emails", async () => {
    for (let i = 0; i < 3; i++) await submit({ email: `p${i}@example.com`, phone: "98450 12345" }).expect(201);
    const res = await submit({ email: "p9@example.com", phone: "+91-98450-12345" }).expect(429);
    expect(res.body.error.details[0].path).toBe("phone");
  });

  it("uses the admin-configured limits, where 0 means unlimited", async () => {
    await prisma.companySetting.create({ data: { id: "default", maxEnquiriesPerEmail: 1, maxEnquiriesPerPhone: 0 } });
    await submit({}).expect(201);
    await submit({}).expect(429);
    await prisma.companySetting.update({ where: { id: "default" }, data: { maxEnquiriesPerEmail: 0 } });
    for (let i = 0; i < 4; i++) await submit({}).expect(201);
  });

  it("only counts enquiries inside the time window", async () => {
    await prisma.companySetting.create({ data: { id: "default", maxEnquiriesPerEmail: 1, enquiryLimitWindowDays: 30 } });
    await submit({}).expect(201);
    await prisma.enquiry.updateMany({ data: { createdAt: new Date(Date.now() - 31 * 86_400_000) } });
    await submit({}).expect(201);
  });

  it("still returns the original record for an idempotent resubmission at the limit", async () => {
    await prisma.companySetting.create({ data: { id: "default", maxEnquiriesPerEmail: 1 } });
    const key = randomUUID();
    const first = await submit({ clientSubmissionId: key }).expect(201);
    const repeat = await submit({ clientSubmissionId: key }).expect(200);
    expect(repeat.body.data.id).toBe(first.body.data.id);
  });
});
