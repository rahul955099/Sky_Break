import { motion } from "motion/react";
import { HardHat, Leaf, ShieldCheck } from "lucide-react";
import { Seo } from "../components/Seo";
import { PageHero } from "../components/PageHero";
import { CtaBand } from "../components/CtaBand";
import { Img } from "../components/ui/Img";
import { Icon } from "../components/ui/icons";
import { SectionHeading } from "../components/ui/misc";
import { ImageReveal, Reveal, Stagger, staggerItem } from "../components/ui/Reveal";
import { company, milestones, team, values } from "../data/content";
import { images } from "../data/images";

export default function About() {
  return (
    <>
      <Seo
        title="About Us"
        description="Learn about Skybreak Infra Pvt Ltd — our vision, mission and values, and our approach to quality, safety and responsible construction."
      />
      <PageHero
        eyebrow="About us"
        title="A construction partner built on trust."
        lead={company.overview}
        crumbs={[{ to: "/", label: "Home" }, { label: "About" }]}
        image={images.about}
        imageAlt={images.aboutAlt}
      />

      <section className="container-x grid gap-12 py-24 sm:py-32 lg:grid-cols-2 lg:gap-20" aria-label="Vision and mission">
        {[
          ["Our vision", company.vision],
          ["Our mission", company.mission],
        ].map(([title, text], i) => (
          <Reveal key={title} delay={i * 0.1} className="relative border-t-2 border-navy pt-8">
            <p className="eyebrow">{String(i + 1).padStart(2, "0")}</p>
            <h2 className="display-md mt-4">{title}</h2>
            <p className="mt-5 text-xl leading-relaxed text-charcoal/80">{text}</p>
          </Reveal>
        ))}
      </section>

      <section className="bg-paper py-24 sm:py-32" aria-labelledby="values-heading">
        <div className="container-x">
          <SectionHeading eyebrow="Our values" title={<span id="values-heading">The principles behind every project.</span>} />
          <Stagger as="ul" className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <motion.li key={v.title} variants={staggerItem} className="group rounded-[22px] bg-white p-7 shadow-soft transition-transform duration-500 hover:-translate-y-1">
                <Icon name={v.icon} className="h-7 w-7 text-blue" />
                <h3 className="mt-6 font-display text-lg font-bold">{v.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{v.text}</p>
              </motion.li>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="container-x grid items-center gap-14 py-24 sm:py-32 lg:grid-cols-2 lg:gap-20" aria-labelledby="quality-heading">
        <ImageReveal className="overflow-hidden rounded-[28px]">
          <Img src={images.quality} alt={images.qualityAlt} width={1200} frameClassName="aspect-[4/3]" />
        </ImageReveal>
        <div>
          <Reveal>
            <p className="eyebrow">Quality & safety</p>
            <h2 id="quality-heading" className="display-lg mt-4">
              Quality is checked, not assumed.
            </h2>
            <p className="lead mt-6">
              We build quality into the process: clear specifications agreed up front, inspections at key construction stages,
              and prompt rectification when something isn't right. Safe site practices protect our teams, clients and
              neighbours throughout.
            </p>
          </Reveal>
          <ul className="mt-8 space-y-4">
            {[
              [ShieldCheck, "Stage-wise quality checks against agreed specifications"],
              [HardHat, "Site safety practices, protective equipment and organised work areas"],
              [ShieldCheck, "Execution according to approved drawings, coordinated with qualified consultants"],
            ].map(([I, text], i) => {
              const Ico = I as typeof ShieldCheck;
              return (
                <Reveal as="li" key={i} delay={0.1 + i * 0.06} className="flex gap-4">
                  <Ico className="mt-0.5 h-5 w-5 shrink-0 text-blue" aria-hidden="true" />
                  <span className="text-charcoal/85">{text as string}</span>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="relative overflow-hidden bg-navy-950 py-24 text-white sm:py-32" aria-labelledby="sustain-heading">
        <div className="bg-blueprint-dark absolute inset-0" aria-hidden="true" />
        <div className="container-x relative grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className="eyebrow text-[#8fb3ff]">Responsible construction</p>
            <h2 id="sustain-heading" className="display-lg mt-4 text-white">
              Building with tomorrow in mind.
            </h2>
            <p className="lead mt-6 text-white/70">
              We aim to make responsible choices wherever practical — durable materials that reduce future maintenance, careful
              planning to limit waste, and designs that make good use of daylight and ventilation. We'll discuss options that
              suit your project, budget and local requirements.
            </p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {["Durable, low-maintenance materials", "Planning that reduces waste", "Daylight & ventilation-aware design", "Respect for neighbours & surroundings"].map((t) => (
                <li key={t} className="flex items-center gap-3 text-white/85">
                  <Leaf className="h-4 w-4 text-emerald-400" aria-hidden="true" /> {t}
                </li>
              ))}
            </ul>
          </Reveal>
          <ImageReveal className="overflow-hidden rounded-[28px]">
            <Img src={images.sustainability} alt={images.sustainabilityAlt} width={1200} frameClassName="aspect-[4/3]" />
          </ImageReveal>
        </div>
      </section>

      <section className="container-x py-24 sm:py-32" aria-labelledby="team-heading">
        <SectionHeading eyebrow="Our team" title={<span id="team-heading">The people behind the work.</span>} />
        {team.length > 0 ? (
          <ul className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((m) => (
              <li key={m.name}>
                {m.image && <Img src={m.image} alt={`Portrait of ${m.name}`} frameClassName="aspect-[4/5] rounded-[22px]" width={700} />}
                <h3 className="mt-5 font-display text-lg font-bold">{m.name}</h3>
                <p className="text-muted">{m.role}</p>
              </li>
            ))}
          </ul>
        ) : (
          <Reveal className="mt-10 max-w-2xl rounded-[22px] border border-dashed border-line p-8 text-muted">
            Team profiles will be published here soon. In the meantime, our team is happy to introduce themselves when you get in
            touch.
          </Reveal>
        )}
      </section>

      {milestones.length > 0 && (
        <section className="container-x pb-24" aria-labelledby="milestones-heading">
          <SectionHeading eyebrow="Milestones" title={<span id="milestones-heading">Our journey so far.</span>} />
          <ol className="mt-12 space-y-8 border-l border-line pl-8">
            {milestones.map((m) => (
              <li key={m.year + m.title}>
                <p className="font-display font-bold text-blue">{m.year}</p>
                <h3 className="mt-1 font-display text-lg font-bold">{m.title}</h3>
                <p className="text-muted">{m.text}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <CtaBand />
    </>
  );
}
