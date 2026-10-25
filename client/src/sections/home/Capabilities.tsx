import { lazy, useRef, useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Icon } from "../../components/ui/icons";
import { Img } from "../../components/ui/Img";
import { Reveal, TextReveal } from "../../components/ui/Reveal";
import { SceneMount } from "../../components/three/SceneMount";
import { useDeviceProfile } from "../../hooks/useDeviceProfile";
import { whyChoose } from "../../data/content";
import { images } from "../../data/images";

const StructureScene = lazy(() => import("../../three/StructureScene"));
const STAGES = ["Frame", "Slabs", "Envelope", "Finish"];

/**
 * "What you can expect from us" — pinned on large screens; scroll assembles the
 * structure from blueprint wireframe to solid while the commitments step through.
 */
export function Capabilities() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion() ?? false;
  const profile = useDeviceProfile();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.55", "end end"] });
  const progress = useRef(reduce ? 1 : 0);
  const [step, setStep] = useState(reduce ? whyChoose.length - 1 : 0);
  const [stage, setStage] = useState(reduce ? STAGES.length - 1 : 0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (reduce) return;
    progress.current = v;
    setStep(Math.min(whyChoose.length - 1, Math.floor(v * whyChoose.length * 1.05)));
    setStage(v < 0.3 ? 0 : v < 0.5 ? 1 : v < 0.75 ? 2 : 3);
  });
  const bar = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : 0, 1]);

  return (
    <section ref={ref} className="relative bg-white lg:h-[260vh]" aria-labelledby="capabilities-heading">
      <div className="bg-blueprint absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="relative lg:sticky lg:top-0 lg:h-svh">
        <div className="container-x grid h-full items-center gap-12 py-24 lg:grid-cols-12 lg:gap-10 lg:py-0">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="eyebrow">Why Skybreak Infra Pvt Ltd</p>
            </Reveal>
            <h2 id="capabilities-heading" className="display-lg mt-5">
              <TextReveal text="What you can expect from us." />
            </h2>
            <div className="relative mt-10 pl-6">
              <div className="absolute top-0 bottom-0 left-0 w-px bg-line" aria-hidden="true">
                <motion.div style={{ scaleY: bar }} className="h-full w-full origin-top bg-blue" />
              </div>
              <ol className="space-y-1">
                {whyChoose.map((item, i) => {
                  const on = i === step;
                  return (
                    <li key={item.title} className={`rounded-2xl p-4 transition-all duration-500 ${on ? "bg-paper shadow-soft lg:translate-x-1" : "lg:opacity-55"}`}>
                      <div className="flex items-center gap-3">
                        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors duration-500 ${on ? "bg-blue text-white" : "bg-blue-50 text-blue"}`}>
                          <Icon name={item.icon} className="h-4 w-4" />
                        </span>
                        <h3 className="font-display text-lg font-bold">{item.title}</h3>
                      </div>
                      <p className={`mt-2 pl-12 text-[0.95rem] leading-relaxed text-muted ${on ? "" : "lg:hidden"}`}>{item.text}</p>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[28px] bg-gradient-to-b from-paper to-white ring-1 ring-line sm:aspect-[5/4] lg:aspect-auto lg:h-[78vh]">
              <SceneMount
                className="absolute inset-0"
                fallback={<Img src={images.threeFallback} alt={images.threeFallbackAlt} width={1400} frameClassName="h-full w-full" />}
              >
                {(visible) => <StructureScene active={visible} reducedMotion={reduce} quality={profile.quality} progress={progress} />}
              </SceneMount>
              <ol className="pointer-events-none absolute top-5 left-5 flex flex-wrap gap-2" aria-label="Construction stages">
                {STAGES.map((s, i) => (
                  <li
                    key={s}
                    className={`rounded-full px-3 py-1.5 text-[0.68rem] font-semibold tracking-[0.16em] uppercase transition-colors duration-500 ${
                      i <= stage ? "bg-ink text-white" : "bg-white/80 text-muted ring-1 ring-line"
                    }`}
                    aria-current={i === stage ? "step" : undefined}
                  >
                    {String(i + 1).padStart(2, "0")} {s}
                  </li>
                ))}
              </ol>
              <span className="pointer-events-none absolute right-5 bottom-5 rounded-full bg-white/80 px-3 py-1.5 text-[0.65rem] font-semibold tracking-[0.2em] text-muted uppercase ring-1 ring-line">
                Concept model
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
