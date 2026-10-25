import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { Seo } from "../components/Seo";
import { PageHero } from "../components/PageHero";
import { CtaBand } from "../components/CtaBand";
import { ProjectCard } from "../components/ProjectCard";
import { EmptyState, ErrorState, Spinner } from "../components/ui/misc";
import { useApi } from "../hooks/useApi";
import { qs } from "../lib/api";
import { categoryLabel } from "../lib/format";
import type { ProjectCategory, ProjectSummary } from "../types/api";

const CATEGORIES: ("" | ProjectCategory)[] = ["", "RESIDENTIAL", "COMMERCIAL", "DEVELOPMENT"];
const PAGE_SIZE = 9;

export default function Projects() {
  const [params, setParams] = useSearchParams();
  const category = (params.get("category") ?? "") as "" | ProjectCategory;
  const search = params.get("search") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [term, setTerm] = useState(search);

  // Debounce the search box into the URL so results are shareable.
  useEffect(() => {
    const t = setTimeout(() => {
      if (term.trim() === search) return;
      const next = new URLSearchParams(params);
      if (term.trim()) next.set("search", term.trim());
      else next.delete("search");
      next.delete("page");
      setParams(next, { replace: true });
    }, 350);
    return () => clearTimeout(t);
  }, [term, search, params, setParams]);

  const path = `/projects${qs({ category: category || undefined, search: search || undefined, page, pageSize: PAGE_SIZE })}`;
  const { data, meta, loading, error, reload } = useApi<ProjectSummary[]>(path);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };

  return (
    <>
      <Seo title="Projects" description="Explore residential, commercial and real estate development projects by Skybreak Infra Pvt Ltd." />
      <PageHero
        eyebrow="Projects"
        title="Spaces that speak for themselves."
        lead="Browse our portfolio by category or search by name and location."
        crumbs={[{ to: "/", label: "Home" }, { label: "Projects" }]}
      />

      <section className="container-x pb-24" aria-label="Project gallery">
        <div className="sticky top-[72px] z-30 -mx-4 mb-10 flex flex-col gap-4 bg-white/85 px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:top-20 lg:flex-row lg:items-center lg:justify-between">
          <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c || "all"}
                onClick={() => update("category", c)}
                aria-pressed={category === c}
                className={`relative rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                  category === c ? "text-white" : "text-charcoal/70 ring-1 ring-line hover:text-navy hover:ring-navy/30"
                }`}
              >
                {category === c && <motion.span layoutId="projects-filter" className="absolute inset-0 rounded-full bg-navy" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
                <span className="relative">{c ? categoryLabel[c] : "All projects"}</span>
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-80">
            <label htmlFor="project-search" className="sr-only">
              Search projects
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="project-search"
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search by name or location"
              className="field-input rounded-full pr-10 pl-11"
            />
            {term && (
              <button onClick={() => setTerm("")} className="absolute top-1/2 right-3 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-paper" aria-label="Clear search">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {data?.some((p) => p.isSample) && (
          <p className="mb-8 inline-flex rounded-full bg-gold/10 px-4 py-2 text-sm text-[#7a5d2b] ring-1 ring-gold/30">
            Projects marked “Illustrative sample” demonstrate the website and are not completed Skybreak Infra Pvt Ltd work.
          </p>
        )}

        <div aria-live="polite" aria-busy={loading}>
          {loading && !data && <Spinner label="Loading projects" />}
          {error && <ErrorState message="Projects couldn't be loaded right now." onRetry={reload} />}
          {data && data.length === 0 && (
            <EmptyState
              title="No projects found"
              text="Try a different category or search term."
              action={
                <button className="font-semibold text-blue hover:underline" onClick={() => (setTerm(""), setParams({}))}>
                  Clear filters
                </button>
              }
            />
          )}
          {data && data.length > 0 && (
            <motion.div layout className={`grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 ${loading ? "opacity-60" : ""}`}>
              <AnimatePresence mode="popLayout">
                {data.map((p, i) => (
                  <motion.div key={p.id} layout initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, delay: i * 0.04 }}>
                    <ProjectCard project={p} priority={i < 3} tall={i % 3 === 1} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {meta && meta.totalPages > 1 && (
          <nav aria-label="Pagination" className="mt-16 flex items-center justify-center gap-3">
            <button
              disabled={page <= 1}
              onClick={() => update("page", String(page - 1))}
              className="grid h-11 w-11 place-items-center rounded-full ring-1 ring-line hover:bg-paper disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm text-muted tabular-nums">
              Page {meta.page} of {meta.totalPages}
            </span>
            <button
              disabled={page >= meta.totalPages}
              onClick={() => update("page", String(page + 1))}
              className="grid h-11 w-11 place-items-center rounded-full ring-1 ring-line hover:bg-paper disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </nav>
        )}
      </section>
      <CtaBand />
    </>
  );
}
