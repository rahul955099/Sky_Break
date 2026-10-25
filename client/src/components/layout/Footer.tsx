import { Link } from "react-router-dom";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { useSettings } from "../../hooks/settings";
import { useApi } from "../../hooks/useApi";
import { telHref } from "../../lib/format";
import { brand } from "../../lib/brand";
import type { ServiceSummary, SocialLinks } from "../../types/api";
import { LogoLockup } from "./Logo";

const socialLabels: Record<keyof SocialLinks, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  x: "X",
};

export function Footer() {
  const s = useSettings();
  const { data: services } = useApi<ServiceSummary[]>("/services");
  const socials = (Object.keys(socialLabels) as (keyof SocialLinks)[]).filter((k) => s.socialLinks?.[k]);
  const year = new Date().getFullYear();

  return (
    <footer className="relative isolate overflow-hidden border-t border-white/10 bg-ink text-white/70">
      <div className="perspective-floor absolute inset-x-[-25%] bottom-0 -z-10 h-[80%] opacity-40" aria-hidden="true" />
      <div className="container-x relative">
        <div className="grid gap-12 py-16 sm:py-20 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link to="/" aria-label={`${s.companyName} — home`} className="inline-block rounded-2xl bg-white p-4 shadow-lg transition-transform duration-500 hover:-translate-y-0.5">
              {s.logoUrl ? <img src={s.logoUrl} alt={brand.logoAlt} className="h-16 w-auto" /> : <LogoLockup className="w-44 sm:w-52" />}
            </Link>
            <p className="mt-6 max-w-sm leading-relaxed">
              Residential construction, commercial construction and real estate development — delivered with quality
              workmanship and transparent project coordination.
            </p>
            {socials.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {socials.map((k) => (
                  <li key={k}>
                    <a href={s.socialLinks[k]!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-white">
                      {socialLabels[k]} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="lg:col-span-3">
            <h2 className="font-display text-sm font-bold tracking-[0.18em] text-white uppercase">Services</h2>
            <ul className="mt-5 space-y-3 text-[0.95rem]">
              {(services ?? []).slice(0, 6).map((svc) => (
                <li key={svc.slug}>
                  <Link to={`/services/${svc.slug}`} className="transition-colors hover:text-white">
                    {svc.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/services" className="font-medium text-[#8fb3ff] hover:text-white">
                  All services →
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h2 className="font-display text-sm font-bold tracking-[0.18em] text-white uppercase">Company</h2>
            <ul className="mt-5 space-y-3 text-[0.95rem]">
              {[
                ["/about", "About us"],
                ["/projects", "Projects"],
                ["/process", "Our process"],
                ["/faq", "FAQs"],
                ["/contact", "Contact"],
              ].map(([to, label]) => (
                <li key={to}>
                  <Link to={to!} className="transition-colors hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h2 className="font-display text-sm font-bold tracking-[0.18em] text-white uppercase">Get in touch</h2>
            <ul className="mt-5 space-y-4 text-[0.95rem]">
              {s.contactEmail && (
                <li className="flex gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#8fb3ff]" aria-hidden="true" />
                  <a href={`mailto:${s.contactEmail}`} className="break-all hover:text-white">
                    {s.contactEmail}
                  </a>
                </li>
              )}
              {s.phone && (
                <li className="flex gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#8fb3ff]" aria-hidden="true" />
                  <a href={telHref(s.phone)} className="hover:text-white">
                    {s.phone}
                  </a>
                </li>
              )}
              {s.address && (
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#8fb3ff]" aria-hidden="true" />
                  <span className="whitespace-pre-line">{s.address}</span>
                </li>
              )}
              {!s.contactEmail && !s.phone && !s.address && (
                <li>
                  <Link to="/contact" className="font-medium text-white hover:underline">
                    Send us an enquiry →
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {s.companyName}. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li>
              <Link to="/privacy-policy" className="hover:text-white">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms-of-use" className="hover:text-white">
                Terms of Use
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
