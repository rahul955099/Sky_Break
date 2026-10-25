import { useLocation } from "react-router-dom";
import { siteConfig } from "../lib/config";
import { useSettings } from "../hooks/settings";
import { brand } from "../lib/brand";

interface SeoProps {
  title?: string;
  description?: string;
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Per-page metadata. React 19 hoists <title>, <meta> and <link> into <head>.
 */
export function Seo({ title, description, image, type = "website", noindex, jsonLd }: SeoProps) {
  const { pathname } = useLocation();
  const settings = useSettings();
  const brand = settings.companyName;
  const fullTitle = title ? `${title} | ${brand}` : (settings.seoTitle ?? `${brand} — ${settings.tagline}`);
  const desc = description ?? settings.seoDescription ?? "";
  const url = `${siteConfig.siteUrl}${pathname === "/" ? "" : pathname}`;
  const ogImage = image ?? settings.ogImageUrl ?? siteConfig.defaultOgImage;
  const absImage = ogImage.startsWith("/") ? `${siteConfig.siteUrl}${ogImage}` : ogImage;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:site_name" content={brand} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={absImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={absImage} />
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </>
  );
}

/** Organization structured data using only information configured by the company. */
export function useOrganizationJsonLd() {
  const s = useSettings();
  const sameAs = Object.values(s.socialLinks ?? {}).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "GeneralContractor",
    name: s.companyName,
    legalName: brand.name,
    slogan: s.tagline,
    url: siteConfig.siteUrl,
    logo: (() => {
      const logo = s.logoUrl ?? brand.logo;
      return logo.startsWith("/") ? siteConfig.siteUrl + logo : logo;
    })(),
    ...(s.contactEmail && { email: s.contactEmail }),
    ...(s.phone && { telephone: s.phone }),
    ...(s.address && { address: s.address }),
    ...(sameAs.length && { sameAs }),
  };
}
