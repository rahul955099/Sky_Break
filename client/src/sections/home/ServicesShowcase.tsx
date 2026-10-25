import { lazy, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { ButtonLink } from "../../components/ui/Button";
import { Icon } from "../../components/ui/icons";
import { Img } from "../../components/ui/Img";
import { ErrorState } from "../../components/ui/misc";
import { Reveal, TextReveal } from "../../components/ui/Reveal";
import { SceneMount } from "../../components/three/SceneMount";
import { useApi } from "../../hooks/useApi";
import { useDeviceProfile } from "../../hooks/useDeviceProfile";
import { serviceModelKind } from "../../three/serviceKinds";
import type { ServiceSummary } from "../../types/api";

const ServiceScene = lazy(() => import("../../three/ServiceScene"));

function ListSkeleton() {
  return (
    <ul className="divide-y divide-charcoal/10 border-y border-charcoal/10" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i} className="flex items-center gap-6 py-7">
          <span className="h-4 w-6 animate-pulse rounded bg-charcoal/10" />
          <span className="h-7 flex-1 animate-pulse rounded bg-charcoal/10" style={{ maxWidth: `${50 + ((i * 13) % 30)}%` }} />
        </li>
      ))}
    </ul>
  );
}

/**
 * Editorial service index paired with a single interactive 3D stage:
 * hovering or focusing a service swaps the miniature model on the pedestal.
 */
export function ServicesShowcase() {
  const { data, loading, error, reload } = useApi<ServiceSummary[]>("/services");
  const reduce = useReducedMotion() ?? false;
  const profile = useDeviceProfile();
  const [activeIndex, setActiveIndex] = useState(0);
  const pointer = useRef({ x: 0, y: 0 });
  const services = data ?? [];
  const active = services[activeIndex];

  return (
    <section className="relative bg-white py-24 sm:py-36" aria-labelledby="services-heading">
      <div className="container-x">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Reveal>
              <p className="eyebrow">What we build</p>
            </Reveal>
            <h2 id="services-heading" className="display-lg mt-5">
              <TextReveal text="Construction solutions for every kind of space." />
            </h2>
          </div>
          <Reveal delay={0.1} className="lg:col-span-5">
            <p className="lead">From a single family home to a multi-building development — one disciplined approach to planning, coordination and execution.</p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Service index */}
          <div className="lg:col-span-6">
            {loading && <ListSkeleton />}
            {error && <ErrorState message="Services couldn't be loaded right now." onRetry={reload} />}
            {data && data.length === 0 && <p className="text-muted">Services will be listed here soon.</p>}
            {services.length > 0 && (
              <ol className="border-t border-charcoal/10">
                {services.map((s, i) => {
                  const on = i === activeIndex;
                  return (
                    <Reveal as="li" key={s.id} delay={Math.min(i, 6) * 0.04} className="border-b border-charcoal/10">
                      <Link
                        to={`/services/${s.slug}`}
                        onMouseEnter={() => setActiveIndex(i)}
                        onFocus={() => setActiveIndex(i)}
                        className="group grid grid-cols-[2.5rem_1fr_auto] items-start gap-x-4 py-6 sm:grid-cols-[3rem_1fr_auto] sm:py-7"
                        aria-describedby={`svc-desc-${s.id}`}
                      >
                        <span className={`pt-1.5 font-display text-sm font-bold tabular-nums transition-colors ${on ? "text-blue" : "text-muted"}`}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span>
                          <span className={`block font-display text-xl font-bold tracking-tight transition-colors duration-300 sm:text-2xl ${on ? "text-charcoal" : "text-charcoal/55 group-hover:text-charcoal"}`}>
                            {s.title}
                          </span>
                          <span
                            id={`svc-desc-${s.id}`}
                            className={`mt-2 block max-w-md text-[0.95rem] leading-relaxed text-muted transition-all duration-500 lg:overflow-hidden ${
                              on ? "lg:max-h-28 lg:opacity-100" : "lg:max-h-0 lg:opacity-0"
                            }`}
                          >
                            {s.shortDescription}
                          </span>
                        </span>
                        <span
                          className={`mt-1 grid h-10 w-10 place-items-center rounded-full ring-1 transition-all duration-300 ${
                            on ? "bg-blue text-white ring-blue" : "text-charcoal/50 ring-charcoal/15 group-hover:text-blue"
                          }`}
                          aria-hidden="true"
                        >
                          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" />
                        </span>
                      </Link>
                    </Reveal>
                  );
                })}
              </ol>
            )}
            <Reveal className="mt-10">
              <ButtonLink to="/services" variant="secondary" arrow>
                All services
              </ButtonLink>
            </Reveal>
          </div>

          {/* 3D stage (desktop and tablet landscape) */}
          <div className="hidden lg:col-span-6 lg:block">
            <div className="sticky top-28">
              <div
                className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-ink"
                onPointerMove={(e) => {
                  if (!profile.finePointer) return;
                  const r = e.currentTarget.getBoundingClientRect();
                  pointer.current = { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -(((e.clientY - r.top) / r.height) * 2 - 1) };
                }}
                onPointerLeave={() => (pointer.current = { x: 0, y: 0 })}
              >
                <div className="perspective-floor absolute inset-x-[-30%] bottom-0 h-1/2 opacity-50" aria-hidden="true" />
                <SceneMount
                  className="absolute inset-0"
                  fallback={active ? <Img src={active.heroImageUrl} alt={active.heroImageAlt} width={900} frameClassName="h-full w-full opacity-80" /> : null}
                >
                  {(visible) =>
                    active ? (
                      <ServiceScene
                        active={visible}
                        reducedMotion={reduce}
                        quality={profile.quality}
                        kind={serviceModelKind(active.slug, active.icon)}
                        pointer={pointer}
                      />
                    ) : null
                  }
                </SceneMount>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/80 to-transparent p-8 pt-24">
                  <AnimatePresence mode="wait">
                    {active && (
                      <motion.div
                        key={active.id}
                        initial={reduce ? false : { opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.35 }}
                      >
                        <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-blue-300 uppercase">
                          <Icon name={active.icon} className="h-4 w-4" /> Service {String(activeIndex + 1).padStart(2, "0")}
                        </span>
                        <p className="mt-3 font-display text-2xl font-bold text-white">{active.title}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <span className="pointer-events-none absolute top-5 left-5 rounded-full bg-white/10 px-3 py-1.5 text-[0.65rem] font-semibold tracking-[0.2em] text-white/70 uppercase backdrop-blur">
                  Concept model
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
