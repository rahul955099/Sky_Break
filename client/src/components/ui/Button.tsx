import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, LoaderCircle } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "light" | "outline-light" | "danger";
type Size = "md" | "lg" | "sm";

const base =
  "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-display font-semibold tracking-tight transition-all duration-300 ease-[var(--ease-premium)] disabled:pointer-events-none disabled:opacity-60 select-none";

const variants: Record<Variant, string> = {
  primary: "bg-blue text-white shadow-[0_8px_24px_-8px_rgb(36_107_253/0.6)] hover:bg-blue-600 hover:shadow-[0_14px_32px_-10px_rgb(36_107_253/0.7)] hover:-translate-y-0.5",
  secondary: "bg-white text-navy ring-1 ring-line hover:ring-navy/30 hover:-translate-y-0.5 shadow-soft",
  ghost: "text-navy hover:bg-navy/5",
  light: "bg-white text-navy hover:bg-paper hover:-translate-y-0.5",
  "outline-light": "text-white ring-1 ring-white/40 hover:bg-white/10 hover:ring-white/70",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-12 px-6 text-[0.95rem]",
  lg: "h-14 px-8 text-base",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  className?: string;
  children: ReactNode;
}

function Content({ children, arrow }: { children: ReactNode; arrow?: boolean }) {
  return (
    <>
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      {arrow && (
        <ArrowRight
          aria-hidden="true"
          className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
        />
      )}
    </>
  );
}

export function ButtonLink({
  to,
  variant = "primary",
  size = "md",
  arrow,
  className = "",
  children,
  ...rest
}: CommonProps & { to: string; "aria-label"?: string }) {
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;
  if (/^(https?:|mailto:|tel:)/.test(to)) {
    return (
      <a href={to} className={cls} {...(to.startsWith("http") && { target: "_blank", rel: "noopener noreferrer" })} {...rest}>
        <Content arrow={arrow}>{children}</Content>
      </a>
    );
  }
  return (
    <Link to={to} className={cls} {...rest}>
      <Content arrow={arrow}>{children}</Content>
    </Link>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  arrow,
  loading,
  className = "",
  children,
  type = "button",
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || rest.disabled}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <LoaderCircle className="relative z-10 h-4 w-4 animate-spin" aria-hidden="true" />}
      <Content arrow={arrow && !loading}>{children}</Content>
    </button>
  );
}
