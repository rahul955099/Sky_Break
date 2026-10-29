import { prisma, type EnquiryStatus, type Prisma } from "../db.js";
import { HttpError, notFound } from "../utils/http.js";
import { sendEnquiryNotification } from "./email.service.js";
import { getSettings } from "./settings.service.js";
import { checkEnquiryCode, consumeEnquiryCode } from "./verification.service.js";

export interface NewEnquiry {
  fullName: string;
  email: string;
  /** Normalised Indian mobile (+91XXXXXXXXXX) or null when the email is verified instead. */
  phone: string | null;
  /** One-time code proving ownership of the email (required when phone is null). */
  emailCode?: string;
  projectType: string;
  projectLocation: string;
  budgetRange: string | null;
  expectedStart: string | null;
  message: string;
  consent: true;
  projectSlug?: string;
  sourcePath?: string;
  clientSubmissionId?: string;
  ipHash: string | null;
  userAgent?: string;
}

export async function createEnquiry(input: NewEnquiry) {
  // Idempotency: a repeated submission with the same client key returns the original record.
  if (input.clientSubmissionId) {
    const existing = await prisma.enquiry.findUnique({ where: { clientSubmissionId: input.clientSubmissionId } });
    if (existing) return { enquiry: existing, duplicate: true };
  }

  await enforceEnquiryLimits(input.email, input.phone);

  // Verify the email code (if any) before writing; wrong attempts are recorded even on failure.
  const verificationId = input.emailCode ? await checkEnquiryCode(input.email, input.emailCode) : null;
  if (!input.phone && !verificationId) {
    throw new HttpError(422, "VALIDATION_ERROR", "Please verify your email address or enter an Indian mobile number.", [
      { path: "emailCode", message: "Without an Indian mobile number, please verify your email with the code we send you" },
    ]);
  }

  const project = input.projectSlug
    ? await prisma.project.findUnique({ where: { slug: input.projectSlug }, select: { id: true } })
    : null;

  const { projectSlug: _p, emailCode: _c, userAgent, ...data } = input;
  const enquiry = await prisma.$transaction(async (tx) => {
    if (verificationId) await consumeEnquiryCode(tx, verificationId);
    return tx.enquiry.create({
      data: { ...data, emailVerified: Boolean(verificationId), userAgent: userAgent?.slice(0, 255), projectId: project?.id ?? null },
    });
  });

  const notified = await sendEnquiryNotification(enquiry);
  if (notified) await prisma.enquiry.update({ where: { id: enquiry.id }, data: { emailNotified: true } });
  return { enquiry: { ...enquiry, emailNotified: notified }, duplicate: false };
}

/**
 * Per-email and per-mobile limits within a rolling window, configured in Admin → Settings
 * (0 = unlimited). Counted against stored enquiries, so they hold across devices and networks.
 */
async function enforceEnquiryLimits(email: string, phone: string | null) {
  const { maxEnquiriesPerEmail, maxEnquiriesPerPhone, enquiryLimitWindowDays } = await getSettings();
  const since = new Date(Date.now() - enquiryLimitWindowDays * 86_400_000);
  const [byEmail, byPhone] = await Promise.all([
    maxEnquiriesPerEmail > 0 ? prisma.enquiry.count({ where: { email, createdAt: { gte: since } } }) : 0,
    maxEnquiriesPerPhone > 0 && phone ? prisma.enquiry.count({ where: { phone, createdAt: { gte: since } } }) : 0,
  ]);
  const tail = "Our team will be in touch with you. If your enquiry is urgent, please contact us directly.";
  if (maxEnquiriesPerEmail > 0 && byEmail >= maxEnquiriesPerEmail) {
    throw new HttpError(429, "ENQUIRY_LIMIT", `We've already received the maximum number of enquiries from this email address recently. ${tail}`, [
      { path: "email", message: "Enquiry limit reached for this email address" },
    ]);
  }
  if (phone && maxEnquiriesPerPhone > 0 && byPhone >= maxEnquiriesPerPhone) {
    throw new HttpError(429, "ENQUIRY_LIMIT", `We've already received the maximum number of enquiries from this mobile number recently. ${tail}`, [
      { path: "phone", message: "Enquiry limit reached for this mobile number" },
    ]);
  }
}

export async function listEnquiries(q: { status?: EnquiryStatus; search?: string; page: number; pageSize: number }) {
  const where: Prisma.EnquiryWhereInput = {
    ...(q.status && { status: q.status }),
    ...(q.search && {
      OR: [
        { fullName: { contains: q.search, mode: "insensitive" } },
        { email: { contains: q.search, mode: "insensitive" } },
        { phone: { contains: q.search } },
        { projectLocation: { contains: q.search, mode: "insensitive" } },
        { projectType: { contains: q.search, mode: "insensitive" } },
      ],
    }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.enquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        projectType: true,
        projectLocation: true,
        status: true,
        createdAt: true,
        _count: { select: { notes: true } },
      },
    }),
    prisma.enquiry.count({ where }),
  ]);
  return { items, total };
}

export async function getEnquiry(id: string) {
  const enquiry = await prisma.enquiry.findUnique({
    where: { id },
    omit: { ipHash: true },
    include: {
      project: { select: { id: true, slug: true, title: true } },
      notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { id: true, name: true } } } },
    },
  });
  if (!enquiry) throw notFound("Enquiry");
  return enquiry;
}

export async function updateEnquiryStatus(id: string, status: EnquiryStatus) {
  return prisma.enquiry.update({ where: { id }, data: { status }, select: { id: true, status: true, updatedAt: true } });
}

export async function addEnquiryNote(enquiryId: string, authorId: string, body: string) {
  await getEnquiry(enquiryId);
  return prisma.enquiryNote.create({
    data: { enquiryId, authorId, body },
    include: { author: { select: { id: true, name: true } } },
  });
}

export async function deleteEnquiry(id: string) {
  await prisma.enquiry.delete({ where: { id } });
}

export async function enquiryStats() {
  const grouped = await prisma.enquiry.groupBy({ by: ["status"], _count: { _all: true } });
  const byStatus = { NEW: 0, CONTACTED: 0, IN_PROGRESS: 0, CLOSED: 0 } as Record<EnquiryStatus, number>;
  for (const g of grouped) byStatus[g.status] = g._count._all;
  return byStatus;
}

const csvCell = (value: unknown) => {
  let s = value == null ? "" : value instanceof Date ? value.toISOString() : String(value);
  // Neutralise spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function exportEnquiriesCsv(status?: EnquiryStatus) {
  const rows = await prisma.enquiry.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 10_000,
    include: { project: { select: { title: true } } },
  });
  const header = [
    "Reference",
    "Received",
    "Status",
    "Full name",
    "Email",
    "Phone",
    "Project type",
    "Location",
    "Budget range",
    "Expected start",
    "Related project",
    "Message",
  ];
  const lines = rows.map((r) =>
    [
      r.id,
      r.createdAt,
      r.status,
      r.fullName,
      r.email,
      r.phone,
      r.projectType,
      r.projectLocation,
      r.budgetRange,
      r.expectedStart,
      r.project?.title,
      r.message,
    ]
      .map(csvCell)
      .join(","),
  );
  return "﻿" + [header.map(csvCell).join(","), ...lines].join("\r\n");
}
