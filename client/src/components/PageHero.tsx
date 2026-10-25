import type { ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Img } from "./ui/Img";
import { TextReveal } from "./ui/Reveal";

interface Crumb {
  to?: string;
  label: string;
}

export function Breadcrumbs({ items, light }: { items: Crumb[]; light?: boolean }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className={`flex flex-wrap items-center gap-1.5 text-sm ${light ? "text-white/70" : "text-muted"}`}>
        {items.map((c, i) => (
          <li key={c.label} className="flex items-center gap-1.5">
            {c.to ? (
              <Link to={c.to} className={light ? "hover:text-white" : "hover:text-navy"}>
                {c.label}
              </Link>
            ) : (
              <span aria-current="page" className={light ? "text-white" : "text-charcoal"}>
                {c.label}
              </span>
            )}
            {i < items.length - 1 && <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Editorial page header: oversized title over a light blueprint backdrop, optional wide image. */
export function PageHero({
  eyebrow,
  title,
  lead,
  crumbs,
  image,
  imageAlt,
  children,
}: {
  eyebrow: string;
  title: string;
  lead?: ReactNode;
  crumbs: Crumb[];
  image?: string;
  imageAlt?: string;
  children?: ReactNode;
}) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 700], [0, reduce ? 0 : 90]);
  const gridY = useTransform(scrollY, [0, 700], [0, reduce ? 0 : 60]);
  return (
    <>
      <header className={`relative isolate overflow-hidden bg-ink pt-32 text-white sm:pt-40 ${image ? "pb-40 sm:pb-56" : "pb-20 sm:pb-28"}`}>
        {/* Architectural stage: receding floor grid, blueprint field and a soft key light */}
        <motion.div style={{ y: gridY }} className="perspective-floor absolute inset-x-[-25%] bottom-0 -z-10 h-[70%]" aria-hidden="true" />
        <div className="bg-blueprint-dark absolute inset-0 -z-10 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" aria-hidden="true" />
        <div className="absolute top-[-40%] right-[-10%] -z-10 h-[90%] w-[60%] rounded-[50%] bg-[radial-gradient(closest-side,rgb(51_96_181/0.32),transparent)]" aria-hidden="true" />
        <div className="container-x relative">
          <Breadcrumbs items={crumbs} light />
          <motion.p
            className="eyebrow mt-8 text-blue-300"
            initial={reduce ? false : { opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {eyebrow}
          </motion.p>
          <h1 className="display-xl mt-5 max-w-5xl text-white">
            <TextReveal text={title} delay={0.1} />
          </h1>
          {lead && (
            <motion.p
              className="lead mt-6 max-w-2xl text-white/70"
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.35 }}
            >
              {lead}
            </motion.p>
          )}
          {children}
        </div>
      </header>
      {image ? (
        // The feature image straddles the dark header and the light page below.
        <div className="container-x relative z-10 -mt-28 sm:-mt-44">
          <motion.div
            className="overflow-hidden rounded-[28px] shadow-[0_40px_100px_-40px_rgb(0_0_0/0.6)]"
            initial={reduce ? false : { clipPath: "inset(16% 6% 16% 6% round 28px)" }}
            animate={{ clipPath: "inset(0% 0% 0% 0% round 28px)" }}
            transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          >
            <motion.div style={{ y }} className="scale-110">
              <Img src={image} alt={imageAlt ?? ""} priority width={2000} frameClassName="aspect-[16/10] sm:aspect-[21/9]" />
            </motion.div>
          </motion.div>
        </div>
      ) : (
        <div className="h-14 sm:h-20" aria-hidden="true" />
      )}
    </>
  );
}
