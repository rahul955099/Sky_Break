import { z } from "zod";

/** Mirrors server/src/schemas (enquiryCreate). The server re-validates everything. */
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

export const START_OPTIONS = ["As soon as possible", "Within 3 months", "3 – 6 months", "6 – 12 months", "More than a year", "Not sure yet"] as const;

export const enquirySchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(120),
  email: z.string().trim().max(200).pipe(z.email("Please enter a valid email address")),
  phone: z
    .string()
    .trim()
    .min(7, "Please enter a valid phone number")
    .max(30)
    .regex(/^[+()\d\s.-]+$/, "Use digits, spaces, +, -, ( and ) only"),
  projectType: z.enum(PROJECT_TYPES, "Please choose a project type"),
  projectLocation: z.string().trim().min(2, "Please enter the project location").max(160),
  budgetRange: z.string().max(60).optional(),
  expectedStart: z.string().max(60).optional(),
  message: z.string().trim().min(10, "Please tell us a little more (at least 10 characters)").max(4000),
  consent: z.boolean().refine((v) => v, "Please confirm consent so we can respond"),
  website: z.string().max(0).optional(),
});

export type EnquiryValues = z.input<typeof enquirySchema>;
