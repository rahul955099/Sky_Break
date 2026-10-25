import { z } from "zod";

const trimmed = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens");

/** Accepts absolute http(s) URLs or site-relative upload paths (e.g. /uploads/abc.webp). */
const imageUrl = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => /^https?:\/\/\S+$/i.test(v) || /^\/uploads\/[\w.-]+$/.test(v), "Enter a valid image URL");

const optionalUrl = z
  .union([z.literal(""), z.url({ protocol: /^https?$/ }).max(500)])
  .optional()
  .nullable()
  .transform((v) => (v ? v : null));

// ── Pagination & listing ───────────────────────────────────────
export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
});

export const projectCategory = z.enum(["RESIDENTIAL", "COMMERCIAL", "DEVELOPMENT"]);
export const projectStatus = z.enum(["CONCEPT", "PLANNED", "UNDER_CONSTRUCTION", "COMPLETED"]);
export const enquiryStatus = z.enum(["NEW", "CONTACTED", "IN_PROGRESS", "CLOSED"]);

export const publicProjectQuery = paginationQuery.extend({
  category: projectCategory.optional(),
  search: trimmed(100).optional(),
  featured: z.enum(["true", "false"]).optional(),
  service: slug.optional(),
});

export const adminProjectQuery = publicProjectQuery.extend({
  published: z.enum(["true", "false"]).optional(),
});

export const enquiryQuery = paginationQuery.extend({
  status: enquiryStatus.optional(),
  search: trimmed(100).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const idParam = z.object({ id: z.string().min(1).max(40) });
export const slugParam = z.object({ slug });

// ── Enquiries ──────────────────────────────────────────────────
export const PROJECT_TYPES = [
  "Residential construction",
  "Luxury villa / independent house",
  "Apartment / residential complex",
  "Commercial construction",
  "Office / retail space",
  "Warehouse / industrial",
  "Real estate development",
  "Civil & structural works",
  "Renovation / remodeling",
  "Other",
] as const;

export const enquiryCreate = z.object({
  fullName: trimmed(120).min(2, "Please enter your full name"),
  email: z.email("Please enter a valid email address").trim().toLowerCase().max(200),
  phone: trimmed(30)
    .min(7, "Please enter a valid phone number")
    .regex(/^[+()\d\s.-]+$/, "Phone number may contain digits, spaces, +, -, ( and ) only"),
  projectType: z.enum(PROJECT_TYPES, "Please choose a project type"),
  projectLocation: trimmed(160).min(2, "Please enter the project location"),
  budgetRange: optionalText(60),
  expectedStart: optionalText(60),
  message: trimmed(4000).min(10, "Please tell us a little more about your project (10+ characters)"),
  consent: z.literal(true, "Please confirm consent so we can respond to your enquiry"),
  projectSlug: slug.optional(),
  sourcePath: trimmed(200).optional(),
  clientSubmissionId: z.uuid().optional(),
  // Anti-spam: honeypot must stay empty; formStartedAt lets us reject instant bot submissions.
  website: z.string().max(0, "Spam detected").optional(),
  formStartedAt: z.number().int().positive().optional(),
});

export const enquiryUpdate = z.object({ status: enquiryStatus });
export const enquiryNoteCreate = z.object({ body: trimmed(4000).min(1, "Note cannot be empty") });

// ── Auth ───────────────────────────────────────────────────────
export const loginBody = z.object({
  email: z.email().trim().toLowerCase().max(200),
  password: z.string().min(1).max(200),
});

// ── Projects ───────────────────────────────────────────────────
const specification = z.object({ label: trimmed(60).min(1), value: trimmed(160).min(1) });
const galleryImage = z.object({ url: imageUrl, alt: trimmed(200).min(1, "Alt text is required") });

export const projectInput = z.object({
  title: trimmed(160).min(2),
  slug: slug.optional(),
  summary: trimmed(400).min(10),
  description: trimmed(10000).min(20),
  category: projectCategory,
  status: projectStatus,
  location: optionalText(160),
  coverImageUrl: imageUrl,
  coverImageAlt: trimmed(200).min(1, "Alt text is required"),
  specifications: z.array(specification).max(20).default([]),
  images: z.array(galleryImage).max(40).default([]),
  serviceIds: z.array(z.string().min(1).max(40)).max(20).default([]),
  isSample: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(10000).default(0),
  seoTitle: optionalText(70),
  seoDescription: optionalText(170),
});
export type ProjectInput = z.infer<typeof projectInput>;

// ── Services ───────────────────────────────────────────────────
export const serviceInput = z.object({
  title: trimmed(120).min(2),
  slug: slug.optional(),
  shortDescription: trimmed(300).min(10),
  intro: trimmed(6000).min(20),
  heroImageUrl: imageUrl,
  heroImageAlt: trimmed(200).min(1),
  icon: trimmed(40).default("building"),
  features: z.array(trimmed(200).min(1)).max(20).default([]),
  workflow: z.array(z.object({ title: trimmed(80).min(1), description: trimmed(400).min(1) })).max(15).default([]),
  faqs: z.array(z.object({ question: trimmed(200).min(1), answer: trimmed(1500).min(1) })).max(20).default([]),
  isPublished: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(10000).default(0),
  seoTitle: optionalText(70),
  seoDescription: optionalText(170),
});
export type ServiceInput = z.infer<typeof serviceInput>;

export const reorderInput = z.object({ ids: z.array(z.string().min(1).max(40)).min(1).max(200) });

// ── Settings ───────────────────────────────────────────────────
export const settingsInput = z.object({
  companyName: trimmed(120).min(2),
  tagline: trimmed(160).min(2),
  contactEmail: z
    .union([z.literal(""), z.email().max(200)])
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  phone: optionalText(40),
  whatsapp: optionalText(40),
  address: optionalText(400),
  officeHours: optionalText(200),
  socialLinks: z
    .object({
      facebook: optionalUrl,
      instagram: optionalUrl,
      linkedin: optionalUrl,
      youtube: optionalUrl,
      x: optionalUrl,
    })
    .default({ facebook: null, instagram: null, linkedin: null, youtube: null, x: null }),
  logoUrl: z.union([z.literal(""), imageUrl]).optional().nullable().transform((v) => (v ? v : null)),
  seoTitle: optionalText(70),
  seoDescription: optionalText(170),
  ogImageUrl: z.union([z.literal(""), imageUrl]).optional().nullable().transform((v) => (v ? v : null)),
});
export type SettingsInput = z.infer<typeof settingsInput>;
