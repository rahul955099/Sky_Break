import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../src/db.js";
import { app, resetDb, seedProject } from "./helpers.js";

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("public API", () => {
  it("GET /api/health reports database status", async () => {
    const res = await request(app).get("/api/health").expect(200);
    expect(res.body.data).toMatchObject({ status: "ok", database: "up", email: "disabled" });
  });

  it("sets security headers and hides the framework", async () => {
    const res = await request(app).get("/api/health");
    expect(res.headers["x-powered-by"]).toBeUndefined();
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    // PUBLIC_SITE_URL is https in tests, so sub-resources are upgraded
    expect(res.headers["content-security-policy"]).toContain("upgrade-insecure-requests");
  });

  it("rejects CORS requests from origins outside the allowlist", async () => {
    await request(app).get("/api/health").set("Origin", "https://evil.example").expect(403);
    const ok = await request(app).get("/api/health").set("Origin", "http://localhost:5173").expect(200);
    expect(ok.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
  });

  it("lists only published projects with pagination meta", async () => {
    await seedProject({ slug: "published-one", title: "Published One" });
    await seedProject({ slug: "hidden-one", title: "Hidden One", isPublished: false });
    const res = await request(app).get("/api/projects").expect(200);
    expect(res.body.data.map((p: { slug: string }) => p.slug)).toEqual(["published-one"]);
    expect(res.body.meta).toMatchObject({ page: 1, total: 1, totalPages: 1 });
  });

  it("filters projects by category and search", async () => {
    await seedProject({ slug: "villa", title: "Garden Villa", category: "RESIDENTIAL" });
    await seedProject({ slug: "office", title: "City Office", category: "COMMERCIAL" });
    const byCategory = await request(app).get("/api/projects?category=RESIDENTIAL").expect(200);
    expect(byCategory.body.data).toHaveLength(1);
    expect(byCategory.body.data[0].slug).toBe("villa");
    const bySearch = await request(app).get("/api/projects?search=office").expect(200);
    expect(bySearch.body.data[0].slug).toBe("office");
    await request(app).get("/api/projects?category=SPACESHIP").expect(422);
  });

  it("returns project detail with gallery and related projects, 404 for unpublished", async () => {
    const p = await seedProject({ slug: "detail-project", category: "RESIDENTIAL" });
    await seedProject({ slug: "related-project", category: "RESIDENTIAL" });
    await seedProject({ slug: "draft-project", isPublished: false });
    await prisma.projectImage.create({ data: { projectId: p.id, url: "https://images.unsplash.com/x", alt: "x" } });
    const res = await request(app).get("/api/projects/detail-project").expect(200);
    expect(res.body.data.images).toHaveLength(1);
    expect(res.body.data.related.map((r: { slug: string }) => r.slug)).toEqual(["related-project"]);
    await request(app).get("/api/projects/draft-project").expect(404);
    await request(app).get("/api/projects/does-not-exist").expect(404);
  });

  it("lists and returns published services", async () => {
    await prisma.service.create({
      data: {
        slug: "residential-construction",
        title: "Residential Construction",
        shortDescription: "Homes built well.",
        intro: "Intro text for the residential service.",
        heroImageUrl: "https://images.unsplash.com/x",
        heroImageAlt: "House",
        faqs: [{ question: "Q?", answer: "A." }],
      },
    });
    await prisma.service.create({
      data: {
        slug: "hidden-service",
        title: "Hidden",
        shortDescription: "Not public.",
        intro: "Hidden service intro text.",
        heroImageUrl: "https://images.unsplash.com/x",
        heroImageAlt: "x",
        isPublished: false,
      },
    });
    const list = await request(app).get("/api/services").expect(200);
    expect(list.body.data).toHaveLength(1);
    const one = await request(app).get("/api/services/residential-construction").expect(200);
    expect(one.body.data.faqs[0].question).toBe("Q?");
    await request(app).get("/api/services/hidden-service").expect(404);
  });

  it("returns public settings without internal fields", async () => {
    const res = await request(app).get("/api/settings").expect(200);
    expect(res.body.data.companyName).toBe("Skybreak Infra Pvt Ltd");
    expect(res.body.data.tagline).toBe("ELEVATING EXCELLENCE");
    expect(res.body.data.contactEmail).toBeNull();
    expect(res.body.data.id).toBeUndefined();
  });

  it("serves sitemap.xml with published URLs on the configured domain and robots.txt", async () => {
    await seedProject({ slug: "in-sitemap" });
    await seedProject({ slug: "not-in-sitemap", isPublished: false });
    const sitemap = await request(app).get("/sitemap.xml").expect(200);
    expect(sitemap.headers["content-type"]).toContain("xml");
    expect(sitemap.text).toContain("https://www.example-site.test/projects/in-sitemap");
    expect(sitemap.text).not.toContain("not-in-sitemap");
    const robots = await request(app).get("/robots.txt").expect(200);
    expect(robots.text).toContain("Disallow: /admin");
    expect(robots.text).toContain("Sitemap: https://www.example-site.test/sitemap.xml");
  });

  it("returns JSON 404 for unknown API routes and handles malformed JSON", async () => {
    const res = await request(app).get("/api/nope").expect(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
    const bad = await request(app).post("/api/enquiries").set("Content-Type", "application/json").send("{bad");
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe("BAD_JSON");
  });
});
