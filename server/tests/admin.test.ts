import fs from "node:fs/promises";
import path from "node:path";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../src/db.js";
import { uploadDir } from "../src/services/upload.service.js";
import { app, createAdmin, login, resetDb, validEnquiry } from "./helpers.js";

let agent: Awaited<ReturnType<typeof login>>["agent"];
let csrf: string;

beforeEach(async () => {
  await resetDb();
  await createAdmin("OWNER", "owner@test.local");
  ({ agent, csrf } = await login("owner@test.local"));
});
afterAll(async () => {
  await fs.rm(uploadDir, { recursive: true, force: true });
  await prisma.$disconnect();
});

const projectBody = (over: Record<string, unknown> = {}) => ({
  title: "Riverside Offices",
  summary: "A sample office scheme by the river.",
  description: "Detailed description of the riverside office sample project.",
  category: "COMMERCIAL",
  status: "PLANNED",
  location: "",
  coverImageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab",
  coverImageAlt: "Glass towers",
  specifications: [{ label: "Typology", value: "Office" }],
  images: [
    { url: "https://images.unsplash.com/a", alt: "First" },
    { url: "/uploads/b.webp", alt: "Second" },
  ],
  isSample: true,
  isPublished: false,
  ...over,
});

describe("admin projects", () => {
  it("creates, edits, publishes and deletes a project", async () => {
    const service = await prisma.service.create({
      data: {
        slug: "commercial-construction",
        title: "Commercial",
        shortDescription: "Commercial builds.",
        intro: "Commercial intro text here.",
        heroImageUrl: "https://images.unsplash.com/x",
        heroImageAlt: "x",
      },
    });

    const created = await agent
      .post("/api/admin/projects")
      .set("X-CSRF-Token", csrf)
      .send(projectBody({ serviceIds: [service.id] }))
      .expect(201);
    const id = created.body.data.id as string;
    expect(created.body.data.slug).toBe("riverside-offices");
    expect(created.body.data.location).toBeNull();
    expect(created.body.data.images.map((i: { alt: string }) => i.alt)).toEqual(["First", "Second"]);
    expect(created.body.data.services[0].slug).toBe("commercial-construction");

    // Not public until published
    await request(app).get("/api/projects/riverside-offices").expect(404);

    const updated = await agent
      .put(`/api/admin/projects/${id}`)
      .set("X-CSRF-Token", csrf)
      .send(projectBody({ title: "Riverside Offices II", slug: "riverside-two", images: [{ url: "https://x.test/c", alt: "Only" }] }))
      .expect(200);
    expect(updated.body.data.slug).toBe("riverside-two");
    expect(updated.body.data.images).toHaveLength(1);
    expect(updated.body.data.services).toHaveLength(0);

    await agent.patch(`/api/admin/projects/${id}/publish`).set("X-CSRF-Token", csrf).send({ isPublished: true }).expect(200);
    await request(app).get("/api/projects/riverside-two").expect(200);

    await agent.delete(`/api/admin/projects/${id}`).set("X-CSRF-Token", csrf).expect(204);
    expect(await prisma.projectImage.count()).toBe(0);
  });

  it("generates unique slugs and rejects duplicate explicit slugs", async () => {
    const a = await agent.post("/api/admin/projects").set("X-CSRF-Token", csrf).send(projectBody()).expect(201);
    const b = await agent.post("/api/admin/projects").set("X-CSRF-Token", csrf).send(projectBody()).expect(201);
    expect(a.body.data.slug).toBe("riverside-offices");
    expect(b.body.data.slug).toBe("riverside-offices-2");
    await agent
      .post("/api/admin/projects")
      .set("X-CSRF-Token", csrf)
      .send(projectBody({ slug: "riverside-offices" }))
      .expect(409);
  });

  it("validates project input", async () => {
    const res = await agent
      .post("/api/admin/projects")
      .set("X-CSRF-Token", csrf)
      .send(projectBody({ title: "", coverImageUrl: "javascript:alert(1)", slug: "Bad Slug" }))
      .expect(422);
    const paths = res.body.error.details.map((d: { path: string }) => d.path);
    expect(paths).toEqual(expect.arrayContaining(["title", "coverImageUrl", "slug"]));
  });
});

describe("admin services", () => {
  const serviceBody = (title: string) => ({
    title,
    shortDescription: "A short description of the service.",
    intro: "A longer introduction to the service offering.",
    heroImageUrl: "https://images.unsplash.com/x",
    heroImageAlt: "Hero",
    features: ["One"],
    workflow: [{ title: "Step", description: "Do it" }],
    faqs: [{ question: "Q?", answer: "A." }],
  });

  it("creates, updates, reorders and unpublishes services", async () => {
    const a = await agent.post("/api/admin/services").set("X-CSRF-Token", csrf).send(serviceBody("Alpha Works")).expect(201);
    const b = await agent.post("/api/admin/services").set("X-CSRF-Token", csrf).send(serviceBody("Beta Works")).expect(201);
    expect(a.body.data.slug).toBe("alpha-works");

    const reordered = await agent
      .put("/api/admin/services/reorder")
      .set("X-CSRF-Token", csrf)
      .send({ ids: [b.body.data.id, a.body.data.id] })
      .expect(200);
    expect(reordered.body.data.map((s: { slug: string }) => s.slug)).toEqual(["beta-works", "alpha-works"]);

    await agent
      .put(`/api/admin/services/${a.body.data.id}`)
      .set("X-CSRF-Token", csrf)
      .send({ ...serviceBody("Alpha Works"), isPublished: false })
      .expect(200);
    const pub = await request(app).get("/api/services").expect(200);
    expect(pub.body.data.map((s: { slug: string }) => s.slug)).toEqual(["beta-works"]);
  });
});

describe("admin enquiries", () => {
  async function submit() {
    const res = await request(app).post("/api/enquiries").send(validEnquiry()).expect(201);
    return res.body.data.id as string;
  }

  it("lists, filters, views, updates status, adds notes and deletes", async () => {
    const id = await submit();
    await submit();

    const list = await agent.get("/api/admin/enquiries?status=NEW").expect(200);
    expect(list.body.meta.total).toBe(2);

    const detail = await agent.get(`/api/admin/enquiries/${id}`).expect(200);
    expect(detail.body.data.message).toContain("family home");
    expect(detail.body.data.ipHash).toBeUndefined();

    await agent.patch(`/api/admin/enquiries/${id}`).set("X-CSRF-Token", csrf).send({ status: "CONTACTED" }).expect(200);
    await agent.patch(`/api/admin/enquiries/${id}`).set("X-CSRF-Token", csrf).send({ status: "LOST" }).expect(422);

    const note = await agent
      .post(`/api/admin/enquiries/${id}/notes`)
      .set("X-CSRF-Token", csrf)
      .send({ body: "Called the client." })
      .expect(201);
    expect(note.body.data.author.name).toBe("OWNER User");

    const contacted = await agent.get("/api/admin/enquiries?status=CONTACTED").expect(200);
    expect(contacted.body.data[0]._count.notes).toBe(1);

    const searched = await agent.get("/api/admin/enquiries?search=person@example").expect(200);
    expect(searched.body.meta.total).toBe(2);

    const dash = await agent.get("/api/admin/dashboard").expect(200);
    expect(dash.body.data.totals).toMatchObject({ enquiries: 2, newEnquiries: 1 });
    expect(dash.body.data.enquiriesByStatus.CONTACTED).toBe(1);

    await agent.delete(`/api/admin/enquiries/${id}`).set("X-CSRF-Token", csrf).expect(204);
    expect(await prisma.enquiryNote.count()).toBe(0);
    await agent.get(`/api/admin/enquiries/${id}`).expect(404);
  });

  it("exports CSV with formula-injection protection", async () => {
    await request(app)
      .post("/api/enquiries")
      .send({ ...validEnquiry(), fullName: "=HYPERLINK(1)" })
      .expect(201);
    const res = await agent.get("/api/admin/enquiries/export").expect(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.headers["content-disposition"]).toContain("attachment");
    expect(res.text).toContain(`"'=HYPERLINK(1)"`);
  });
});

describe("admin settings and uploads", () => {
  it("updates company settings and exposes them publicly", async () => {
    await agent
      .put("/api/admin/settings")
      .set("X-CSRF-Token", csrf)
      .send({
        companyName: "Skybreak Infra",
        tagline: "Building Dreams. Creating Landmarks.",
        contactEmail: "hello@company.test",
        phone: "+00 000 000",
        socialLinks: { linkedin: "https://www.linkedin.com/company/test", facebook: "" },
      })
      .expect(200);
    const pub = await request(app).get("/api/settings").expect(200);
    expect(pub.body.data.contactEmail).toBe("hello@company.test");
    expect(pub.body.data.socialLinks.linkedin).toContain("linkedin.com");
    expect(pub.body.data.socialLinks.facebook).toBeNull();
  });

  it("rejects non-image uploads and spoofed content, accepts a real PNG", async () => {
    await agent
      .post("/api/admin/uploads")
      .set("X-CSRF-Token", csrf)
      .attach("image", Buffer.from("<script>alert(1)</script>"), { filename: "x.html", contentType: "text/html" })
      .expect(400);
    await agent
      .post("/api/admin/uploads")
      .set("X-CSRF-Token", csrf)
      .attach("image", Buffer.from("definitely not a png file"), { filename: "x.png", contentType: "image/png" })
      .expect(400);

    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );
    const ok = await agent
      .post("/api/admin/uploads")
      .set("X-CSRF-Token", csrf)
      .attach("image", png, { filename: "pixel.png", contentType: "image/png" })
      .expect(201);
    expect(ok.body.data.url).toMatch(/^\/uploads\/[\w-]+\.png$/);
    await fs.access(path.join(uploadDir, path.basename(ok.body.data.url)));
    await request(app).get(ok.body.data.url).expect(200).expect("Content-Type", /image\/png/);
  });
});
