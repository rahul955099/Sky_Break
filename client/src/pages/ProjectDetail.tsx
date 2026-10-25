import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Expand, Info, MapPin } from "lucide-react";
import { Seo } from "../components/Seo";
import { Breadcrumbs } from "../components/PageHero";
import { ProjectCard } from "../components/ProjectCard";
import { EnquiryForm } from "../components/EnquiryForm";
import { Img } from "../components/ui/Img";
import { Lightbox } from "../components/ui/Lightbox";
import { Icon } from "../components/ui/icons";
import { Badge, ErrorState, SampleBadge, SectionHeading, Spinner } from "../components/ui/misc";
import { ImageReveal, Reveal, TextReveal } from "../components/ui/Reveal";
import { useApi } from "../hooks/useApi";
import { categoryLabel, statusLabel } from "../lib/format";
import type { ProjectDetail as Project } from "../types/api";
import NotFound from "./NotFound";

export default function ProjectDetail() {
  const { slug = "" } = useParams();
  const { data: p, loading, error, reload } = useApi<Project>(`/projects/${encodeURIComponent(slug)}`);
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (error?.status === 404) return <NotFound />;
  if (loading || (!p && !error)) return <div className="min-h-[80vh] bg-ink pt-40"><Spinner label="Loading project" /></div>;
  if (error || !p) return <div className="min-h-[70vh] bg-ink px-4 pt-40"><ErrorState message="This project couldn't be loaded." onRetry={reload} /></div>;

  const gallery = [{ url: p.coverImageUrl, alt: p.coverImageAlt }, ...p.images.map((i) => ({ url: i.url, alt: i.alt }))];
  const facts = [
    ["Category", categoryLabel[p.category]],
    ["Status", statusLabel[p.status]],
    ["Location", p.location ?? "—"],
  ];

  return (
    <>
      <Seo title={p.seoTitle ?? p.title} description={p.seoDescription ?? p.summary} image={p.coverImageUrl} type="article" />

      <header className="relative isolate overflow-hidden bg-ink pt-32 pb-40 text-white sm:pt-40 sm:pb-56">
        <div className="perspective-floor absolute inset-x-[-25%] bottom-0 -z-10 h-[70%]" aria-hidden="true" />
        <div className="absolute top-[-40%] right-[-10%] -z-10 h-[90%] w-[60%] rounded-[50%] bg-[radial-gradient(closest-side,rgb(51_96_181/0.32),transparent)]" aria-hidden="true" />
        <div className="container-x relative">
          <Breadcrumbs light items={[{ to: "/", label: "Home" }, { to: "/projects", label: "Projects" }, { label: p.title }]} />
          <div className="mt-8 flex flex-wrap gap-2">
            <Badge tone="dark">{categoryLabel[p.category]}</Badge>
            <Badge tone="dark">{statusLabel[p.status]}</Badge>
            {p.isSample && <SampleBadge className="bg-white/90" />}
          </div>
          <h1 className="display-xl mt-5 max-w-5xl text-white">
            <TextReveal text={p.title} />
          </h1>
          <p className="lead mt-6 max-w-2xl text-white/70">{p.summary}</p>
          {p.location && (
            <p className="mt-4 inline-flex items-center gap-2 text-white/60">
              <MapPin className="h-4 w-4" aria-hidden="true" /> {p.location}
            </p>
          )}
        </div>
      </header>
      <div className="container-x relative z-10 -mt-28 sm:-mt-44">
        <button onClick={() => setLightbox(0)} className="group relative block w-full overflow-hidden rounded-[28px] shadow-[0_40px_100px_-40px_rgb(0_0_0/0.6)]" aria-label="Open image gallery">
          <ImageReveal>
            <Img src={p.coverImageUrl} alt={p.coverImageAlt} priority width={2000} frameClassName="aspect-[16/10] sm:aspect-[21/9]" className="group-hover:scale-[1.03]" />
          </ImageReveal>
          <span className="absolute right-5 bottom-5 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-navy shadow-lg backdrop-blur">
            <Expand className="h-4 w-4" aria-hidden="true" /> View gallery ({gallery.length})
          </span>
        </button>
      </div>

      {p.isSample && (
        <div className="container-x mt-10">
          <p className="flex items-start gap-3 rounded-2xl bg-gold/10 p-5 text-sm text-[#6b5126] ring-1 ring-gold/30">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            This is an illustrative sample used to demonstrate the website. It does not represent completed Skybreak Infra Pvt Ltd work.
          </p>
        </div>
      )}

      <section className="container-x grid gap-14 py-20 sm:py-24 lg:grid-cols-12 lg:gap-20">
        <Reveal className="lg:col-span-7">
          <h2 className="display-md">About the project</h2>
          <div className="prose-sb mt-6">
            {p.description.split(/\n{2,}/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </Reveal>
        <aside className="space-y-6 lg:col-span-5">
          <Reveal className="rounded-[24px] bg-paper p-8">
            <h2 className="font-display text-lg font-bold">Project details</h2>
            <dl className="mt-5 divide-y divide-line">
              {facts.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-6 py-3 text-[0.95rem]">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right font-semibold">{v}</dd>
                </div>
              ))}
              {p.specifications.map((s) => (
                <div key={s.label} className="flex justify-between gap-6 py-3 text-[0.95rem]">
                  <dt className="text-muted">{s.label}</dt>
                  <dd className="text-right font-semibold">{s.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
          {p.services.length > 0 && (
            <Reveal delay={0.1} className="rounded-[24px] border border-line p-8">
              <h2 className="font-display text-lg font-bold">Related services</h2>
              <ul className="mt-5 space-y-3">
                {p.services.map((s) => (
                  <li key={s.id}>
                    <Link to={`/services/${s.slug}`} className="group flex items-center gap-3 font-medium hover:text-blue">
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue">
                        <Icon name={s.icon} className="h-4 w-4" />
                      </span>
                      {s.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
        </aside>
      </section>

      {p.images.length > 0 && (
        <section className="container-x pb-20" aria-labelledby="gallery-heading">
          <h2 id="gallery-heading" className="display-md">
            Gallery
          </h2>
          <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {p.images.map((im, i) => (
              <Reveal as="li" key={im.id} delay={(i % 3) * 0.06} className={i === 0 ? "col-span-2 row-span-2" : ""}>
                <button onClick={() => setLightbox(i + 1)} className="group block h-full w-full overflow-hidden rounded-[20px]" aria-label={`Enlarge image: ${im.alt}`}>
                  <Img src={im.url} alt={im.alt} width={i === 0 ? 1400 : 800} frameClassName={i === 0 ? "aspect-square sm:aspect-auto sm:h-full" : "aspect-square"} className="group-hover:scale-[1.06]" />
                </button>
              </Reveal>
            ))}
          </ul>
        </section>
      )}

      <Lightbox images={gallery} index={lightbox} onChange={setLightbox} />

      <section className="bg-paper py-20 sm:py-24" aria-labelledby="project-enquiry-heading">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading
              eyebrow="Enquire"
              title={<span id="project-enquiry-heading">Planning something similar?</span>}
              lead="Send us an enquiry and mention what you liked about this project. We'll be in touch to discuss your requirements."
            />
          </div>
          <Reveal className="rounded-[28px] bg-white p-6 shadow-soft sm:p-10 lg:col-span-7">
            <EnquiryForm projectSlug={p.slug} />
          </Reveal>
        </div>
      </section>

      {p.related && p.related.length > 0 && (
        <section className="container-x py-20 sm:py-24" aria-labelledby="related-projects-heading">
          <SectionHeading eyebrow="More projects" title={<span id="related-projects-heading">Related projects</span>} />
          <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {p.related.map((r) => (
              <ProjectCard key={r.id} project={r} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
