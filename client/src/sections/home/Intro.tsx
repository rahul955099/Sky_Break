import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ButtonLink } from "../../components/ui/Button";
import { Img } from "../../components/ui/Img";
import { Reveal, TextReveal } from "../../components/ui/Reveal";
import { company } from "../../data/content";
import { images } from "../../data/images";

/** Blueprint floor-plan sheet used as the middle depth layer. */
function PlanSheet() {
  return (
    <svg viewBox="0 0 320 240" className="h-full w-full" fill="none" aria-hidden="true">
      <rect width="320" height="240" fill="#f7f8fb" />
      <g stroke="#3360b5" strokeWidth="1.4">
        <path d="M30 30 H290 V210 H30 Z" strokeWidth="3" />
        <path d="M30 120 H150 M150 30 V210 M150 150 H290 M220 30 V150" />
        <path d="M60 120 A30 30 0 0 1 90 90" strokeDasharray="3 3" />
        <path d="M150 180 A30 30 0 0 1 180 150" strokeDasharray="3 3" />
      </g>
      <g stroke="#9aa9bf" strokeWidth="0.8">
        <path d="M30 222 H290 M30 218 V226 M290 218 V226 M150 218 V226" />
        <path d="M302 30 V210 M298 30 H306 M298 210 H306" />
      </g>
      <g fill="#3360b5" fontFamily="Inter, sans-serif" fontSize="9" letterSpacing="1.5">
        <text x="48" y="78">LIVING</text>
        <text x="172" y="96">KITCHEN</text>
        <text x="48" y="170">BED 01</text>
        <text x="236" y="96">STUDY</text>
        <text x="190" y="188">TERRACE</text>
      </g>
    </svg>
  );
}

export function Intro() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const r = (a: number, b: number) => (reduce ? [0, 0] : [a, b]);
  const rotateY = useTransform(scrollYProgress, [0, 1], r(-14, 8));
  const rotateX = useTransform(scrollYProgress, [0, 1], r(10, -4));
  const backY = useTransform(scrollYProgress, [0, 1], r(40, -40));
  const midY = useTransform(scrollYProgress, [0, 1], r(90, -70));
  const frontY = useTransform(scrollYProgress, [0, 1], r(150, -120));

  return (
    <section ref={ref} id="intro" className="relative scroll-mt-20 overflow-hidden bg-stone py-24 sm:py-36" aria-labelledby="intro-heading">
      <div className="bg-blueprint absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)]" aria-hidden="true" />
      <div className="container-x relative grid items-center gap-16 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-6 xl:col-span-5">
          <Reveal>
            <p className="eyebrow">Skybreak Infra Pvt Ltd</p>
          </Reveal>
          <h2 id="intro-heading" className="display-lg mt-5">
            <TextReveal text="Spaces built with care, coordinated with clarity." />
          </h2>
          <Reveal delay={0.1}>
            <p className="lead mt-7">{company.overview}</p>
          </Reveal>
          <div className="mt-12 grid gap-8 border-t border-charcoal/10 pt-10 sm:grid-cols-2">
            {[
              ["01", "Vision", company.vision],
              ["02", "Mission", company.mission],
            ].map(([n, title, text], i) => (
              <Reveal key={title} delay={0.15 + i * 0.08}>
                <p className="font-display text-xs font-bold tracking-[0.2em] text-blue">{n}</p>
                <h3 className="mt-2 font-display text-lg font-bold">{title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{text}</p>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.25} className="mt-10">
            <ButtonLink to="/about" variant="secondary" arrow>
              About the company
            </ButtonLink>
          </Reveal>
        </div>

        {/* Layered depth composition */}
        <div className="relative lg:col-span-6 xl:col-span-7" style={{ perspective: 1600 }}>
          <motion.div style={{ rotateY, rotateX, transformStyle: "preserve-3d" }} className="relative mx-auto aspect-[5/4] w-full max-w-[640px]">
            <motion.div style={{ y: backY, translateZ: -80 }} className="absolute inset-y-[6%] left-0 w-[74%] overflow-hidden rounded-[22px] shadow-lift">
              <Img src={images.intro} alt={images.introAlt} width={1200} sizes="(min-width:1024px) 40vw, 80vw" frameClassName="h-full w-full" />
            </motion.div>
            <motion.div
              style={{ y: midY, translateZ: 40 }}
              className="absolute top-[2%] right-0 w-[46%] overflow-hidden rounded-[14px] bg-white shadow-lift ring-1 ring-black/5"
            >
              <div className="flex items-center justify-between border-b border-line px-3 py-2 text-[0.6rem] font-semibold tracking-[0.18em] text-muted uppercase">
                <span>Plan · Level 01</span>
                <span className="text-blue">Draft</span>
              </div>
              <PlanSheet />
            </motion.div>
            <motion.div style={{ y: frontY, translateZ: 120 }} className="absolute right-[8%] bottom-0 w-[40%] overflow-hidden rounded-[18px] border-[6px] border-white shadow-lift">
              <Img src={images.introSecondary} alt={images.introSecondaryAlt} width={700} frameClassName="aspect-[4/3]" />
            </motion.div>
            <motion.div
              style={{ y: frontY, translateZ: 160 }}
              className="absolute bottom-[30%] left-[-2%] hidden items-center gap-3 rounded-full bg-ink px-4 py-2.5 text-xs font-semibold tracking-wide text-white shadow-lift sm:flex"
            >
              <span className="h-2 w-2 rounded-full bg-blue-300" aria-hidden="true" />
              Planning · Design coordination · Construction
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
