import { Link } from "react-router-dom";
import { useSettings } from "../../hooks/settings";
import { brand } from "../../lib/brand";

// Intrinsic sizes of the brand files, so the browser reserves space before they load.
const MARK = { width: 687, height: 335 };
const LOCKUP = { width: 794, height: 572 };

/**
 * The eye-and-house symbol cropped from the official logo.
 * The artwork has an opaque white background, so on dark surfaces it sits on a white tile.
 */
export function LogoMark({ className = "h-9", onDark = false, alt = "" }: { className?: string; onDark?: boolean; alt?: string }) {
  const img = <img src={brand.mark} alt={alt} {...MARK} className={`${className} w-auto shrink-0 select-none`} draggable={false} />;
  return onDark ? <span className="inline-flex shrink-0 rounded-lg bg-white px-1.5 py-1 shadow-sm">{img}</span> : img;
}

/** The complete original lockup (symbol, company name and tagline), white space trimmed. */
export function LogoLockup({ className = "w-56", priority = false }: { className?: string; priority?: boolean }) {
  return (
    <img
      src={brand.logoCropped}
      alt={brand.logoAlt}
      {...LOCKUP}
      className={`${className} h-auto select-none`}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
    />
  );
}

/** Navbar / footer logo: symbol plus company name, with the tagline from small screens up. */
export function Logo({ light = false }: { light?: boolean }) {
  const { companyName, tagline, logoUrl } = useSettings();
  return (
    <Link to="/" className="group flex min-w-0 items-center gap-2.5 sm:gap-3" aria-label={`${companyName} — home`}>
      {logoUrl ? (
        <img src={logoUrl} alt={brand.logoAlt} className="h-9 w-auto shrink-0 sm:h-10" />
      ) : (
        <LogoMark
          alt={brand.logoAlt}
          onDark={light}
          className="h-8 transition-transform duration-500 group-hover:scale-[1.04] sm:h-10 lg:h-9 xl:h-11"
        />
      )}
      <span className="flex min-w-0 flex-col leading-none">
        <span
          className={`font-display text-[0.95rem] font-extrabold tracking-tight whitespace-nowrap min-[360px]:text-[1.02rem] sm:text-[1.1rem] lg:text-[1rem] xl:text-[1.1rem] ${
            light ? "text-white" : "text-[#1a1a1a]"
          }`}
        >
          {companyName}
        </span>
        <span className={`mt-1 hidden text-[0.62rem] font-semibold tracking-[0.2em] whitespace-nowrap uppercase sm:block ${light ? "text-[#9db6ea]" : "text-brand"}`}>
          {tagline}
        </span>
      </span>
    </Link>
  );
}
