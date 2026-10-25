import type { EnquiryStatus, ProjectCategory, ProjectStatus } from "../types/api";

export const categoryLabel: Record<ProjectCategory, string> = {
  RESIDENTIAL: "Residential",
  COMMERCIAL: "Commercial",
  DEVELOPMENT: "Development",
};

export const statusLabel: Record<ProjectStatus, string> = {
  CONCEPT: "Concept",
  PLANNED: "Planned",
  UNDER_CONSTRUCTION: "Under construction",
  COMPLETED: "Completed",
};

export const enquiryStatusLabel: Record<EnquiryStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  IN_PROGRESS: "In progress",
  CLOSED: "Closed",
};

export const enquiryStatusTone: Record<EnquiryStatus, string> = {
  NEW: "bg-blue-50 text-blue ring-blue/20",
  CONTACTED: "bg-amber-50 text-amber-700 ring-amber-600/20",
  IN_PROGRESS: "bg-violet-50 text-violet-700 ring-violet-600/20",
  CLOSED: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export const formatDate = (iso: string, withTime = false) =>
  new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime && { hour: "2-digit", minute: "2-digit" }),
  }).format(new Date(iso));

/** Builds responsive Unsplash URLs; other URLs pass through unchanged. */
export function imageSrc(url: string, width: number) {
  if (!url.includes("images.unsplash.com")) return url;
  const u = new URL(url);
  u.searchParams.set("w", String(width));
  u.searchParams.set("auto", "format");
  u.searchParams.set("fit", "crop");
  if (!u.searchParams.has("q")) u.searchParams.set("q", "80");
  return u.toString();
}

export function imageSrcSet(url: string, widths = [480, 800, 1200, 1600, 2200]) {
  if (!url.includes("images.unsplash.com")) return undefined;
  return widths.map((w) => `${imageSrc(url, w)} ${w}w`).join(", ");
}

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
export const whatsappHref = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;
