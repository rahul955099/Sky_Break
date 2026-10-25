import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Info } from "lucide-react";
import { Seo } from "../components/Seo";
import { PageHero } from "../components/PageHero";
import { CtaBand } from "../components/CtaBand";
import { Img } from "../components/ui/Img";
import { ImageReveal, Reveal } from "../components/ui/Reveal";
import { processSteps } from "../data/content";
import { images } from "../data/images";

export default function Process() {
  const ref = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 70%"] });
  const scaleY = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : 0, 1]);

  return (
    <>
      <Seo
        title="Our Process"
        description="How Skybreak Infra Pvt Ltd delivers projects: consultation, requirements, feasibility, design coordination, proposal, scheduling, construction with quality checks, and handover."
      />
      <PageHero
        eyebrow="Our process"
        title="A clear path from idea to handover."
        lead="Eight stages, each with a clear purpose. Knowing what happens next makes building less stressful — and keeps decisions in your hands."
        crumbs={[{ to: "/", label: "Home" }, { label: "Our Process" }]}
        image={images.process}
        imageAlt={images.processAlt}
      />

      <section className="container-x py-24 sm:py-32" aria-label="Process timeline">
        <ol ref={ref} className="relative">
          {/* timeline spine */}
          <div className="absolute top-0 bottom-0 left-[27px] w-px bg-line md:left-1/2" aria-hidden="true">
            <motion.div style={{ scaleY }} className="h-full w-full origin-top bg-blue" />
          </div>
          {processSteps.map((step, i) => {
            const right = i % 2 === 1;
            return (
              <li key={step.title} className="relative grid gap-6 pb-16 pl-20 last:pb-0 md:grid-cols-2 md:gap-16 md:pl-0">
                <span className="absolute top-0 left-0 z-10 grid h-14 w-14 place-items-center rounded-full bg-white font-display text-lg font-extrabold text-blue shadow-soft ring-1 ring-line md:left-1/2 md:-translate-x-1/2">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Reveal className={`md:pt-2 ${right ? "md:order-2 md:pl-14" : "md:pr-14 md:text-right"}`}>
                  <h2 className="font-display text-2xl font-bold sm:text-3xl">{step.title}</h2>
                  <p className="mt-3 text-lg leading-relaxed text-muted">{step.text}</p>
                </Reveal>
                <ImageReveal className={`overflow-hidden rounded-[22px] ${right ? "md:order-1 md:mr-14" : "md:ml-14"}`}>
                  <Img src={step.image} alt="" width={900} frameClassName="aspect-[16/10]" />
                </ImageReveal>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="container-x pb-8">
        <Reveal className="flex items-start gap-4 rounded-[22px] bg-paper p-6 sm:p-8">
          <Info className="mt-1 h-5 w-5 shrink-0 text-blue" aria-hidden="true" />
          <p className="leading-relaxed text-charcoal/85">
            <strong className="font-semibold">Please note:</strong> timelines, pricing, permits and deliverables depend on each
            project's scope, site conditions and applicable regulatory requirements. Stages may overlap or be adapted to suit your
            project. We'll confirm the specifics with you in writing before work begins.
          </p>
        </Reveal>
      </section>
      <CtaBand />
    </>
  );
}
