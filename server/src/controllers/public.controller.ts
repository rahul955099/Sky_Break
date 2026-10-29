import type { RequestHandler } from "express";
import { prisma } from "../db.js";
import type { z } from "zod";
import type { emailCodeRequest, enquiryCreate, publicProjectQuery } from "../schemas/index.js";
import * as projects from "../services/projects.service.js";
import * as services from "../services/services.service.js";
import { createEnquiry } from "../services/enquiries.service.js";
import { getSettings } from "../services/settings.service.js";
import { emailEnabled } from "../services/email.service.js";
import { badRequest, HttpError, ok, pageMeta } from "../utils/http.js";
import { emailDomainAcceptsMail } from "../utils/contact.js";
import { issueEnquiryCode } from "../services/verification.service.js";
import { env } from "../config/env.js";
import { hashIp } from "../utils/security.js";

export const health: RequestHandler = async (_req, res) => {
  let database: "up" | "down" = "up";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "down";
  }
  res.status(database === "up" ? 200 : 503).json({
    data: { status: database === "up" ? "ok" : "degraded", database, email: emailEnabled() ? "configured" : "disabled" },
  });
};

export const listProjects: RequestHandler = async (_req, res) => {
  const q = res.locals.query as z.infer<typeof publicProjectQuery>;
  const { items, total } = await projects.listProjects(q, { publicOnly: true });
  ok(res, items, pageMeta(q.page, q.pageSize, total));
};

export const getProject: RequestHandler = async (req, res) => {
  ok(res, await projects.getPublishedProject(String(req.params.slug)));
};

export const listServices: RequestHandler = async (_req, res) => {
  ok(res, await services.listServices({ publicOnly: true }));
};

export const getService: RequestHandler = async (req, res) => {
  ok(res, await services.getPublishedService(String(req.params.slug)));
};

/** Public subset of company settings for the header, footer and contact page. */
export const getPublicSettings: RequestHandler = async (_req, res) => {
  const s = await getSettings();
  ok(res, {
    companyName: s.companyName,
    tagline: s.tagline,
    contactEmail: s.contactEmail,
    phone: s.phone,
    whatsapp: s.whatsapp,
    address: s.address,
    officeHours: s.officeHours,
    socialLinks: s.socialLinks,
    logoUrl: s.logoUrl,
    seoTitle: s.seoTitle,
    seoDescription: s.seoDescription,
    ogImageUrl: s.ogImageUrl,
  });
};

const MIN_FILL_MS = 2500;

async function assertDeliverableEmail(email: string) {
  if (!env.EMAIL_DOMAIN_CHECK) return;
  if (!(await emailDomainAcceptsMail(email))) {
    const message = "This email domain can't receive mail. Please check the address for typos.";
    throw new HttpError(422, "VALIDATION_ERROR", message, [{ path: "email", message }]);
  }
}

export const requestEmailCode: RequestHandler = async (req, res) => {
  const { email } = req.body as z.infer<typeof emailCodeRequest>;
  await assertDeliverableEmail(email);
  ok(res, await issueEnquiryCode(email, hashIp(req.ip)));
};

export const submitEnquiry: RequestHandler = async (req, res) => {
  const body = req.body as z.infer<typeof enquiryCreate>;
  if (body.formStartedAt && Date.now() - body.formStartedAt < MIN_FILL_MS) {
    throw badRequest("The form was submitted too quickly. Please try again.");
  }
  await assertDeliverableEmail(body.email);
  const { website: _w, formStartedAt: _f, ...fields } = body;
  const { enquiry, duplicate } = await createEnquiry({
    ...fields,
    ipHash: hashIp(req.ip),
    userAgent: req.get("user-agent"),
  });
  ok(
    res,
    { id: enquiry.id, createdAt: enquiry.createdAt, emailNotified: enquiry.emailNotified, duplicate },
    undefined,
    duplicate ? 200 : 201,
  );
};
