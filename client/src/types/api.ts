export type ProjectCategory = "RESIDENTIAL" | "COMMERCIAL" | "DEVELOPMENT";
export type ProjectStatus = "CONCEPT" | "PLANNED" | "UNDER_CONSTRUCTION" | "COMPLETED";
export type EnquiryStatus = "NEW" | "CONTACTED" | "IN_PROGRESS" | "CLOSED";
export type AdminRole = "OWNER" | "ADMIN" | "EDITOR";

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ProjectSummary {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: ProjectCategory;
  status: ProjectStatus;
  location: string | null;
  coverImageUrl: string;
  coverImageAlt: string;
  isSample: boolean;
  isPublished?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  updatedAt?: string;
}

export interface ProjectImage {
  id: string;
  url: string;
  alt: string;
  sortOrder: number;
}

export interface Specification {
  label: string;
  value: string;
}

export interface ServiceRef {
  id: string;
  slug: string;
  title: string;
  icon: string;
}

export interface ProjectDetail extends ProjectSummary {
  description: string;
  specifications: Specification[];
  images: ProjectImage[];
  services: ServiceRef[];
  seoTitle: string | null;
  seoDescription: string | null;
  related?: ProjectSummary[];
}

export interface ServiceSummary {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  heroImageUrl: string;
  heroImageAlt: string;
  icon: string;
  isPublished: boolean;
  sortOrder: number;
}

export interface WorkflowStep {
  title: string;
  description: string;
}
export interface Faq {
  question: string;
  answer: string;
}

export interface ServiceDetail extends ServiceSummary {
  intro: string;
  features: string[];
  workflow: WorkflowStep[];
  faqs: Faq[];
  seoTitle: string | null;
  seoDescription: string | null;
  projects?: ProjectSummary[];
}

export interface SocialLinks {
  facebook?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  youtube?: string | null;
  x?: string | null;
}

export interface CompanySettings {
  companyName: string;
  tagline: string;
  contactEmail: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  officeHours: string | null;
  socialLinks: SocialLinks;
  logoUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
}

/** Settings as seen by admins, including enquiry limits (0 = unlimited). */
export interface AdminCompanySettings extends CompanySettings {
  maxEnquiriesPerEmail: number;
  maxEnquiriesPerPhone: number;
  enquiryLimitWindowDays: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

export interface EnquirySummary {
  id: string;
  fullName: string;
  email: string;
  /** Indian mobile in +91XXXXXXXXXX form, or null when the email was verified instead. */
  phone: string | null;
  emailVerified?: boolean;
  projectType: string;
  projectLocation: string;
  status: EnquiryStatus;
  createdAt: string;
  _count?: { notes: number };
}

export interface EnquiryNote {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string } | null;
}

export interface EnquiryDetail extends EnquirySummary {
  budgetRange: string | null;
  expectedStart: string | null;
  message: string;
  consent: boolean;
  sourcePath: string | null;
  emailNotified: boolean;
  userAgent: string | null;
  updatedAt: string;
  project: { id: string; slug: string; title: string } | null;
  notes: EnquiryNote[];
}

export interface DashboardData {
  totals: { enquiries: number; newEnquiries: number; projects: number; publishedProjects: number; services: number };
  enquiriesByStatus: Record<EnquiryStatus, number>;
  recentEnquiries: Pick<EnquirySummary, "id" | "fullName" | "projectType" | "projectLocation" | "status" | "createdAt">[];
  emailDelivery: "configured" | "disabled";
}
