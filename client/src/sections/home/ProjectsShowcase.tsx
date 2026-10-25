import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Info, MapPin } from "lucide-react";
import { ButtonLink } from "../../components/ui/Button";
import { Img } from "../../components/ui/Img";
import { ErrorState } from "../../components/ui/misc";
import { Reveal, TextReveal } from "../../components/ui/Reveal";
import { TiltCard } from "../../components/ui/TiltCard";
import { useApi } from "../../hooks/useApi";
import { categoryLabel, statusLabel } from "../../lib/format";
import type { ProjectCategory, ProjectSummary } from "../../types/api";

const FILTERS: ("FEATURED" | ProjectCategory)[] = ["FEATURED", "RESIDENTIAL", "COMMERCIAL", "DEVELOPMENT"];

/** Cinematic image-led project tile; `feature` renders the large lead composition. */
function ShowcaseCard({ project, feature = false, priority = false }: { project: ProjectSummary; feature?: boolean; priority?: boolean }) {
  return (
    <TiltCard className="h-full" max={feature ? 3 : 5}>
      <article className="group relative h-full overflow-hidden rounded-[26px] bg-ink-800 ring-1 ring-white/10">
        <Link to={`/projects/${project.slug}`} className="block h-full focus-visible:outline-offset-4">
          <div className={`relative h-full ${feature ? "min-h-[420px] sm:min-h-[520px]" : "min-h-[300px]"}`}>
            <Img
              src={project.coverImageUrl}
              alt={project.coverImageAlt}
              width={feature ? 1800 : 1000}
              sizes={feature ? "(min-width:1024px) 66vw, 100vw" : "(min-width:1024px) 33vw, 100vw"}
              priority={priority}
              frameClassName="absolute inset-0"
              className="scale-[1.04] transition-transform duration-[1.6s] ease-[var(--ease-premium)] group-hover:scale-[1.12]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 via-35% to-transparent to-75%" />
            <div className="absolute top-5 left-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-ink/70 px-3 py-1 text-[0.7rem] font-semibold text-white ring-1 ring-white/15 backdrop-blur">
                {categoryLabel[project.category]}
              </span>
              {project.isSample && (
                <span className="rounded-full bg-white/90 px-3 py-1 text-[0.7rem] font-semibold text-[#7a5d2b]">Illustrative sample</span>
              )}
            </div>
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-white/65">
                <span className="font-semibold tracking-[0.16em] text-blue-300 uppercase">{statusLabel[project.status]}</span>
                {project.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {project.location}
                  </span>
                )}
              </div>
              <h3 className={`mt-2 font-display font-bold tracking-tight text-white ${feature ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl"}`}>
                {project.title}
              </h3>
              <p className={`mt-2 max-w-xl leading-relaxed text-white/70 ${feature ? "" : "line-clamp-2 text-sm"}`}>{project.summary}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white">
                View project
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-ink transition-transform duration-500 group-hover:rotate-45">
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </span>
            </div>
          </div>
        </Link>
      </article>
    </TiltCard>
  );
}

function ShowcaseSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-3" aria-hidden="true">
      <div className="h-[520px] animate-pulse rounded-[26px] bg-white/5 lg:col-span-2 lg:row-span-2" />
      <div className="h-[250px] animate-pulse rounded-[26px] bg-white/5" />
      <div className="h-[250px] animate-pulse rounded-[26px] bg-white/5" />
    </div>
  );
}

export function ProjectsShowcase() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("FEATURED");
  const { data, loading, error, reload } = useApi<ProjectSummary[]>("/projects?pageSize=24");
  const all = data ?? [];
  const items = (filter === "FEATURED" ? all.filter((p) => p.isFeatured) : all.filter((p) => p.category === filter)).slice(0, 6);
  const shown = items.length ? items : filter === "FEATURED" ? all.slice(0, 6) : [];
  const [lead, ...rest] = shown;
  const hasSamples = shown.some((p) => p.isSample);

  return (
    <section className="relative overflow-hidden bg-ink py-24 text-white sm:py-36" aria-labelledby="projects-heading">
      <div className="bg-blueprint-dark absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="container-x relative">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Reveal>
              <p className="eyebrow text-blue-300">Selected work</p>
            </Reveal>
            <h2 id="projects-heading" className="display-lg mt-5 text-white">
              <TextReveal text="A portfolio shaped by purpose." />
            </h2>
          </div>
          <Reveal delay={0.1}>
            <div role="tablist" aria-label="Filter projects by category" className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  role="tab"
                  aria-selected={filter === f}
                  onClick={() => setFilter(f)}
                  className={`relative rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                    filter === f ? "text-ink" : "text-white/70 ring-1 ring-white/15 hover:text-white hover:ring-white/40"
                  }`}
                >
                  {filter === f && <motion.span layoutId="showcase-filter" className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
                  <span className="relative">{f === "FEATURED" ? "Featured" : categoryLabel[f]}</span>
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        {hasSamples && (
          <p className="mt-8 inline-flex items-start gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white/70 ring-1 ring-white/10">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
            Projects labelled “Illustrative sample” demonstrate the website and are not completed company work.
          </p>
        )}

        <div className="mt-12">
          {loading && <ShowcaseSkeleton />}
          {error && <ErrorState message="Projects couldn't be loaded right now." onRetry={reload} />}
          {data && shown.length === 0 && (
            <div className="rounded-[26px] border border-dashed border-white/15 px-6 py-16 text-center">
              <p className="font-display text-xl font-bold">No projects in this category yet</p>
              <p className="mt-2 text-white/60">New work will appear here as it is published.</p>
            </div>
          )}
          {lead && (
            <AnimatePresence mode="wait">
              <motion.div
                key={filter}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="grid gap-5 lg:grid-cols-3"
              >
                <div className="lg:col-span-2 lg:row-span-2">
                  <ShowcaseCard project={lead} feature priority />
                </div>
                {rest.slice(0, 2).map((p) => (
                  <ShowcaseCard key={p.id} project={p} />
                ))}
                {rest.slice(2, 5).map((p) => (
                  <ShowcaseCard key={p.id} project={p} />
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        <div className="mt-14 flex justify-center">
          <ButtonLink to="/projects" variant="outline-light" arrow>
            Explore Our Projects
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
