import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { Menu, X } from "lucide-react";
import { navLinks } from "../../lib/config";
import { ButtonLink } from "../ui/Button";
import { Logo } from "./Logo";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [inHero, setInHero] = useState(true);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { scrollY } = useScroll();
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled(y > 12);
    // The homepage hero is pinned for ~2 viewport heights; keep a dark bar over it.
    setInHero(y < window.innerHeight * 1.85);
  });

  // Close the mobile menu on navigation.
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    menuRef.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));
  // Every public page opens on a dark cinematic header, so the bar starts transparent with light text.
  const transparent = !scrolled && !open;
  const darkGlass = !transparent && !open && pathname === "/" && inHero;
  const overDark = transparent || darkGlass;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-[var(--ease-premium)] ${
          transparent
            ? "bg-transparent"
            : darkGlass
              ? "bg-ink/70 shadow-[0_1px_0_rgb(255_255_255/0.06)] backdrop-blur-xl"
              : "bg-white/85 shadow-[0_1px_0_rgb(18_59_93/0.08)] backdrop-blur-xl"
        }`}
      >
        <nav aria-label="Primary" className="container-x flex h-[72px] items-center justify-between gap-4 lg:h-20 xl:gap-6">
          <Logo light={overDark} />

          <ul className="hidden items-center gap-0.5 lg:flex xl:gap-1">
            {navLinks.map((link) => (
              <li key={link.to} className="relative">
                <NavLink
                  to={link.to}
                  end={link.to === "/"}
                  className={`relative block rounded-full px-2.5 py-2 text-[0.88rem] font-medium whitespace-nowrap transition-colors xl:px-4 xl:text-[0.92rem] ${
                    overDark
                      ? isActive(link.to)
                        ? "text-white"
                        : "text-white/70 hover:text-white"
                      : isActive(link.to)
                        ? "text-navy"
                        : "text-charcoal/70 hover:text-navy"
                  }`}
                >
                  {isActive(link.to) && (
                    <motion.span
                      layoutId="nav-indicator"
                      className={`absolute inset-0 -z-10 rounded-full ${overDark ? "bg-white/12 ring-1 ring-white/15" : "bg-navy/[0.06]"}`}
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <ButtonLink to="/contact" size="sm" className="h-11 px-5 whitespace-nowrap max-sm:hidden lg:px-4 xl:px-5" arrow>
              Get a Quote
            </ButtonLink>
            <button
              ref={toggleRef}
              type="button"
              className={`grid h-11 w-11 place-items-center rounded-full transition lg:hidden ${
                overDark ? "text-white ring-1 ring-white/30 hover:bg-white/10" : "text-navy ring-1 ring-line hover:bg-navy/5"
              }`}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Rendered outside <header>: its backdrop-filter would become the containing block for this fixed panel. */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            ref={menuRef}
            className="fixed inset-x-0 top-[72px] bottom-0 z-40 overflow-y-auto bg-white lg:hidden"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="bg-blueprint absolute inset-0 opacity-60" aria-hidden="true" />
            <ul className="container-x relative flex flex-col pt-6 pb-10">
              {navLinks.map((link, i) => (
                <motion.li
                  key={link.to}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.4 }}
                  className="border-b border-line"
                >
                  <NavLink
                    to={link.to}
                    end={link.to === "/"}
                    className={`flex items-center justify-between py-4 font-display text-2xl font-bold ${
                      isActive(link.to) ? "text-blue" : "text-charcoal"
                    }`}
                  >
                    {link.label}
                    <span className="text-sm font-medium text-muted">0{i + 1}</span>
                  </NavLink>
                </motion.li>
              ))}
              <li className="pt-8">
                <ButtonLink to="/contact" size="lg" className="w-full" arrow>
                  Get a Quote
                </ButtonLink>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
