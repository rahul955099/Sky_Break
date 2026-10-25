import { Seo } from "../components/Seo";
import { PageHero } from "../components/PageHero";
import { CtaBand } from "../components/CtaBand";
import { Accordion } from "../components/ui/misc";
import { Reveal } from "../components/ui/Reveal";
import { faqs } from "../data/content";

export default function Faq() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.flatMap((g) =>
      g.items.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
    ),
  };
  return (
    <>
      <Seo title="FAQs" description="Answers to common questions about construction projects, estimates, planning, renovation and how enquiries are handled." jsonLd={jsonLd} />
      <PageHero
        eyebrow="FAQs"
        title="Questions, answered honestly."
        lead="If you can't find what you're looking for, send us an enquiry — we're happy to help."
        crumbs={[{ to: "/", label: "Home" }, { label: "FAQs" }]}
      />
      <section className="container-x space-y-16 pb-24 sm:pb-32">
        {faqs.map((group, gi) => (
          <Reveal key={group.category} className="grid gap-8 lg:grid-cols-12">
            <h2 className="font-display text-2xl font-bold lg:col-span-4">{group.category}</h2>
            <div className="lg:col-span-8">
              <Accordion items={group.items} defaultOpen={gi === 0 ? 0 : null} />
            </div>
          </Reveal>
        ))}
      </section>
      <CtaBand />
    </>
  );
}
