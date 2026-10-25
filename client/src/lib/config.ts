/**
 * Central site configuration.
 *
 * Company contact details are intentionally EMPTY. Real values are entered by an
 * administrator in /admin/settings and served by GET /api/settings, which overrides
 * these defaults at runtime. Never hard-code unverified phone numbers or addresses here.
 */
import type { CompanySettings } from "../types/api";
import { brand } from "./brand";

export const siteConfig = {
  /** Canonical production origin. Set VITE_PUBLIC_SITE_URL in .env. */
  siteUrl: (import.meta.env.VITE_PUBLIC_SITE_URL ?? "http://localhost:5173").replace(/\/$/, ""),
  defaultOgImage: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1200&h=630&q=80",
};

export const defaultSettings: CompanySettings = {
  companyName: brand.name,
  tagline: brand.tagline,
  contactEmail: null,
  phone: null,
  whatsapp: null,
  address: null,
  officeHours: null,
  socialLinks: {},
  logoUrl: null,
  seoTitle: null,
  seoDescription:
    "Skybreak Infra Pvt Ltd delivers residential construction, commercial construction and real estate development with quality workmanship and transparent project coordination.",
  ogImageUrl: null,
};

export const navLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/projects", label: "Projects" },
  { to: "/process", label: "Our Process" },
  { to: "/contact", label: "Contact" },
] as const;
