import { useParams } from "react-router-dom";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { Seo } from "../components/Seo";
import { PageHero } from "../components/PageHero";
import { ProjectCard } from "../components/ProjectCard";
import { EnquiryForm } from "../components/EnquiryForm";
import { Accordion, ErrorState, SectionHeading, Spinner } from "../components/ui/misc";
import { Reveal, Stagger, staggerItem } from "../components/ui/Reveal";
import { useApi } from "../hooks/useApi";
import { siteConfig } from "../lib/config";
import type { PROJECT_TYPES } from "../lib/enquirySchema";
import type { ServiceDetail as Service } from "../types/api";
import NotFound from "./NotFound";

const serviceToProjectType: Record<string, (typeof PROJECT_TYPES)[number]> = {
  "residential-construction": "Residential construction",
  "luxury-villas-independent-houses": "Luxury villa / independent house",
  "apartments-residential-complexes": "Apartment / residential complex",
  "commercial-construction": "Commercial construction",
  "office-buildings-retail-spaces": "Office / retail space",
  "real-estate-development": "Real estate development",
  "civil-structural-construction": "Civil & structural works",
  "renovation-remodeling": "Renovation / remodeling",
};

export default function ServiceDetail() {
  const { slug = "" } = useParams();
  const { data: s, loading, error, reload } = useApi<Service>(`/services/${encodeURIComponent(slug)}`);

  if (error?.status === 404) return <NotFound />;
  if (loading || (!s && !error)) return <div className="min-h-[80vh] bg-ink pt-40"><Spinner label="Loading service" /></div>;
  if (error || !s) return <div className="min-h-[70vh] bg-ink px-4 pt-40"><ErrorState message="This service couldn't be loaded." onRetry={reload} /></div>;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: s.title,
      description: s.shortDescription,
      serviceType: s.title,
      provider: { "@type": "GeneralContractor", name: "Skybreak Infra Pvt Ltd", url: siteConfig.siteUrl },
      url: `${siteConfig.siteUrl}/services/${s.slug}`,
    },
    ...(s.faqs.length
      ? [
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: s.faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
          },
        ]
      : []),
  ];

  return (
    <>
      <Seo title={s.seoTitle ?? s.title} description={s.seoDescription ?? s.shortDescription} image={s.heroImageUrl} jsonLd={jsonLd} />
      <PageHero
        eyebrow="Service"
        title={s.title}
        lead={s.shortDescription}
        crumbs={[{ to: "/", label: "Home" }, { to: "/services", label: "Services" }, { label: s.title }]}
        image={s.heroImageUrl}
        imageAlt={s.heroImageAlt}
      />

      <section className="container-x grid gap-14 py-24 sm:py-28 lg:grid-cols-12 lg:gap-20">
        <Reveal className="lg:col-span-7">
          <h2 className="display-md">Overview</h2>
          <div className="prose-sb mt-6">
            {s.intro.split(/\n{2,}/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </Reveal>
        <div className="lg:col-span-5">
          <Reveal className="rounded-[24px] bg-paper p-8 sm:p-10">
            <h2 className="font-display text-xl font-bold">Key features</h2>
            <ul className="mt-6 space-y-4">
              {s.features.map((f) => (
                <li key={f} className="flex gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue text-white">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span className="text-charcoal/85">{f}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {s.workflow.length > 0 && (
        <section className="relative overflow-hidden bg-navy-950 py-24 text-white sm:py-28" aria-labelledby="workflow-heading">
          <div className="bg-blueprint-dark absolute inset-0" aria-hidden="true" />
          <div className="container-x relative">
            <SectionHeading dark eyebrow="Typical workflow" title={<span id="workflow-heading">How a {s.title.toLowerCase()} project comes together.</span>} />
            <Stagger as="ol" className="mt-14 grid gap-px overflow-hidden rounded-[24px] bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
              {s.workflow.map((step, i) => (
                <motion.li key={step.title} variants={staggerItem} className="bg-navy-950/95 p-8">
                  <span className="font-display text-sm font-bold text-[#8fb3ff] tabular-nums">Step {String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-3 font-display text-lg font-bold text-white">{step.title}</h3>
                  <p className="mt-2 leading-relaxed text-white/65">{step.description}</p>
                </motion.li>
              ))}
            </Stagger>
            <p className="mt-8 max-w-3xl text-sm text-white/55">
              Timelines, pricing, permits and deliverables depend on the project scope and applicable requirements.
            </p>
          </div>
        </section>
      )}

      {s.projects && s.projects.length > 0 && (
        <section className="container-x py-24 sm:py-28" aria-labelledby="related-heading">
          <SectionHeading eyebrow="Related projects" title={<span id="related-heading">Related work</span>} />
          <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {s.projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      )}

      {s.faqs.length > 0 && (
        <section className="bg-paper py-24 sm:py-28" aria-labelledby="faq-heading">
          <div className="container-x grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SectionHeading eyebrow="FAQs" title={<span id="faq-heading">Common questions</span>} />
            </div>
            <div className="lg:col-span-8">
              <Accordion items={s.faqs} />
            </div>
          </div>
        </section>
      )}

      <section className="container-x py-24 sm:py-28" aria-labelledby="service-enquiry-heading">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading
              eyebrow="Enquire"
              title={<span id="service-enquiry-heading">Discuss your {s.title.toLowerCase()} project.</span>}
              lead="Tell us a little about what you're planning. We'll get back to you to talk through the details."
            />
          </div>
          <Reveal className="rounded-[28px] border border-line p-6 sm:p-10 lg:col-span-7">
            <EnquiryForm defaultProjectType={serviceToProjectType[s.slug]} />
          </Reveal>
        </div>
      </section>
    </>
  );
}
