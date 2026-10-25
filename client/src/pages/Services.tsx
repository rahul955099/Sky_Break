import { Seo } from "../components/Seo";
import { PageHero } from "../components/PageHero";
import { CtaBand } from "../components/CtaBand";
import { ServiceCard } from "../components/ServiceCard";
import { ErrorState, Spinner } from "../components/ui/misc";
import { Stagger } from "../components/ui/Reveal";
import { useApi } from "../hooks/useApi";
import type { ServiceSummary } from "../types/api";

export default function Services() {
  const { data, loading, error, reload } = useApi<ServiceSummary[]>("/services");
  return (
    <>
      <Seo
        title="Services"
        description="Residential construction, luxury villas, apartments, commercial buildings, offices and retail, real estate development, civil and structural works, renovation and complete construction solutions."
      />
      <PageHero
        eyebrow="Services"
        title="Everything it takes to build well."
        lead="Explore our construction services. Each one follows the same principles: careful planning, coordinated design, quality workmanship and clear communication."
        crumbs={[{ to: "/", label: "Home" }, { label: "Services" }]}
      />
      <section className="container-x pb-24" aria-label="All services">
        {loading && <Spinner label="Loading services" />}
        {error && <ErrorState message="Services couldn't be loaded right now." onRetry={reload} />}
        {data && (
          <Stagger as="ul" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((s, i) => (
              <ServiceCard key={s.id} service={s} index={i} />
            ))}
          </Stagger>
        )}
      </section>
      <CtaBand />
    </>
  );
}
