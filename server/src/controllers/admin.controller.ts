import type { RequestHandler } from "express";
import type { z } from "zod";
import { prisma } from "../db.js";
import type {
  adminProjectQuery,
  enquiryQuery,
  ProjectInput,
  ServiceInput,
  SettingsInput,
} from "../schemas/index.js";
import { enquiryStatus } from "../schemas/index.js";
import * as projects from "../services/projects.service.js";
import * as services from "../services/services.service.js";
import * as enquiries from "../services/enquiries.service.js";
import { getSettings, updateSettings } from "../services/settings.service.js";
import { saveImage } from "../services/upload.service.js";
import { emailEnabled } from "../services/email.service.js";
import { ok, pageMeta } from "../utils/http.js";

const id = (req: Parameters<RequestHandler>[0]) => String(req.params.id);

// ── Dashboard ──────────────────────────────────────────────────
export const dashboard: RequestHandler = async (_req, res) => {
  const [byStatus, totalEnquiries, projectCount, publishedProjects, serviceCount, recent] = await Promise.all([
    enquiries.enquiryStats(),
    prisma.enquiry.count(),
    prisma.project.count(),
    prisma.project.count({ where: { isPublished: true } }),
    prisma.service.count(),
    prisma.enquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, fullName: true, projectType: true, projectLocation: true, status: true, createdAt: true },
    }),
  ]);
  ok(res, {
    totals: {
      enquiries: totalEnquiries,
      newEnquiries: byStatus.NEW,
      projects: projectCount,
      publishedProjects,
      services: serviceCount,
    },
    enquiriesByStatus: byStatus,
    recentEnquiries: recent,
    emailDelivery: emailEnabled() ? "configured" : "disabled",
  });
};

// ── Projects ───────────────────────────────────────────────────
export const listProjects: RequestHandler = async (_req, res) => {
  const q = res.locals.query as z.infer<typeof adminProjectQuery>;
  const { items, total } = await projects.listProjects(q, { publicOnly: false });
  ok(res, items, pageMeta(q.page, q.pageSize, total));
};
export const getProject: RequestHandler = async (req, res) => ok(res, await projects.getProjectById(id(req)));
export const createProject: RequestHandler = async (req, res) =>
  ok(res, await projects.createProject(req.body as ProjectInput), undefined, 201);
export const updateProject: RequestHandler = async (req, res) =>
  ok(res, await projects.updateProject(id(req), req.body as ProjectInput));
export const publishProject: RequestHandler = async (req, res) =>
  ok(res, await projects.setProjectPublished(id(req), Boolean((req.body as { isPublished: boolean }).isPublished)));
export const deleteProject: RequestHandler = async (req, res) => {
  await projects.deleteProject(id(req));
  res.status(204).end();
};

// ── Services ───────────────────────────────────────────────────
export const listServices: RequestHandler = async (_req, res) => ok(res, await services.listServices({ publicOnly: false }));
export const getService: RequestHandler = async (req, res) => ok(res, await services.getServiceById(id(req)));
export const createService: RequestHandler = async (req, res) =>
  ok(res, await services.createService(req.body as ServiceInput), undefined, 201);
export const updateService: RequestHandler = async (req, res) =>
  ok(res, await services.updateService(id(req), req.body as ServiceInput));
export const reorderServices: RequestHandler = async (req, res) => {
  await services.reorderServices((req.body as { ids: string[] }).ids);
  ok(res, await services.listServices({ publicOnly: false }));
};
export const deleteService: RequestHandler = async (req, res) => {
  await services.deleteService(id(req));
  res.status(204).end();
};

// ── Enquiries ──────────────────────────────────────────────────
export const listEnquiries: RequestHandler = async (_req, res) => {
  const q = res.locals.query as z.infer<typeof enquiryQuery>;
  const { items, total } = await enquiries.listEnquiries(q);
  ok(res, items, pageMeta(q.page, q.pageSize, total));
};
export const getEnquiry: RequestHandler = async (req, res) => ok(res, await enquiries.getEnquiry(id(req)));
export const updateEnquiry: RequestHandler = async (req, res) =>
  ok(res, await enquiries.updateEnquiryStatus(id(req), (req.body as { status: z.infer<typeof enquiryStatus> }).status));
export const addEnquiryNote: RequestHandler = async (req, res) =>
  ok(res, await enquiries.addEnquiryNote(id(req), req.user!.id, (req.body as { body: string }).body), undefined, 201);
export const deleteEnquiry: RequestHandler = async (req, res) => {
  await enquiries.deleteEnquiry(id(req));
  res.status(204).end();
};
export const exportEnquiries: RequestHandler = async (req, res) => {
  const status = enquiryStatus.optional().parse(req.query.status || undefined);
  const csv = await enquiries.exportEnquiriesCsv(status);
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="skybreak-enquiries-${stamp}.csv"`);
  res.setHeader("Cache-Control", "no-store");
  res.send(csv);
};

// ── Settings & uploads ─────────────────────────────────────────
export const getAdminSettings: RequestHandler = async (_req, res) => ok(res, await getSettings());
export const putAdminSettings: RequestHandler = async (req, res) =>
  ok(res, await updateSettings(req.body as SettingsInput));
export const uploadImage: RequestHandler = async (req, res) => ok(res, await saveImage(req.file), undefined, 201);
