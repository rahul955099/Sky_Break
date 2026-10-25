import { Router } from "express";
import { prisma } from "../db.js";
import { siteUrl } from "../config/env.js";

export const seoRouter = Router();

const STATIC_PATHS = [
  "/",
  "/about",
  "/services",
  "/projects",
  "/process",
  "/contact",
  "/faq",
  "/privacy-policy",
  "/terms-of-use",
];

const xmlEscape = (s: string) => s.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`);

seoRouter.get("/sitemap.xml", async (_req, res) => {
  const [projects, services] = await Promise.all([
    prisma.project.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
    prisma.service.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
  ]);
  const urls = [
    ...STATIC_PATHS.map((p) => ({ loc: p, lastmod: undefined as Date | undefined })),
    ...services.map((s) => ({ loc: `/services/${s.slug}`, lastmod: s.updatedAt })),
    ...projects.map((p) => ({ loc: `/projects/${p.slug}`, lastmod: p.updatedAt })),
  ];
  const body = urls
    .map(
      (u) =>
        `  <url><loc>${xmlEscape(siteUrl + u.loc)}</loc>${
          u.lastmod ? `<lastmod>${u.lastmod.toISOString().slice(0, 10)}</lastmod>` : ""
        }</url>`,
    )
    .join("\n");
  res
    .type("application/xml")
    .set("Cache-Control", "public, max-age=3600")
    .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
});

seoRouter.get("/robots.txt", (_req, res) => {
  res
    .type("text/plain")
    .send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
});
