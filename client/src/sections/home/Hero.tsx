import { lazy, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ButtonLink } from "../../components/ui/Button";
import { Img } from "../../components/ui/Img";
import { TextReveal } from "../../components/ui/Reveal";
import { LogoLockup } from "../../components/layout/Logo";
import { SceneMount } from "../../components/three/SceneMount";
import { useDeviceProfile } from "../../hooks/useDeviceProfile";
import { useSettings } from "../../hooks/settings";
import { images } from "../../data/images";

const HeroScene = lazy(() => import("../../three/HeroScene"));
const EASE = [0.22, 1, 0.36, 1] as const;

/** Poster shown while the 3D scene downloads: a blueprint skyline drawing itself. */
function LoadingExperience({ reduce }: { reduce: boolean }) {
  const draw = (delay: number) => ({
    initial: reduce ? false : { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: { duration: 1.6, ease: EASE, delay },
  });
  return (
    <motion.div className="absolute inset-0 bg-ink" exit={{ opacity: 0 }} transition={{ duration: 0.9 }} aria-hidden="true">
      <div className="perspective-floor absolute inset-x-[-20%] bottom-0 h-[55%] opacity-60" />
      <svg viewBox="0 0 800 420" className="absolute right-[4%] bottom-[18%] w-[min(760px,92vw)] text-blue-300/50 max-lg:right-1/2 max-lg:translate-x-1/2 max-lg:bottom-[52%] max-lg:w-[80vw]" fill="none" stroke="currentColor" strokeWidth="1.2">
        <motion.path d="M20 400 H780" {...draw(0)} />
        <motion.path d="M300 400 V90 H430 V400 M310 140 H420 M310 190 H420 M310 240 H420 M310 290 H420 M310 340 H420" {...draw(0.15)} />
        <motion.path d="M330 90 V40 H400 V90" {...draw(0.4)} />
        <motion.path d="M120 400 V210 H250 V400 M130 250 H240 M130 300 H240 M130 350 H240" {...draw(0.3)} />
        <motion.path d="M500 400 V330 H690 V400 M480 330 H710" {...draw(0.45)} />
        <motion.path d="M560 400 V20 M560 30 H770 M560 30 H470 M600 30 V140" {...draw(0.6)} strokeDasharray="4 5" />
      </svg>
      <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[0.7rem] font-semibold tracking-[0.3em] text-white/40 uppercase">Preparing 3D experience</p>
    </motion.div>
  );
}

function StaticFallback() {
  return (
    <div className="absolute inset-0">
      <Img src={images.cta} alt="" priority width={2000} frameClassName="h-full w-full" />
      <div className="absolute inset-0 bg-ink/70" />
    </div>
  );
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion() ?? false;
  const profile = useDeviceProfile();
  const { tagline } = useSettings();
  const [ready, setReady] = useState(!profile.webgl);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const progress = useRef(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    progress.current = v;
  });
  const pointer = useRef({ x: 0, y: 0 });

  const copyOpacity = useTransform(scrollYProgress, [0, 0.26], [1, reduce ? 1 : 0]);
  const copyY = useTransform(scrollYProgress, [0, 0.26], [0, reduce ? 0 : -70]);
  const captionOpacity = useTransform(scrollYProgress, [0.26, 0.34, 0.46, 0.54], [0, 1, 1, 0]);
  const captionY = useTransform(scrollYProgress, [0.26, 0.34], [30, 0]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);

  return (
    <section
      ref={ref}
      aria-labelledby="hero-heading"
      className={`relative bg-ink text-white ${reduce ? "h-svh" : "h-[180svh] lg:h-[200svh]"}`}
      onPointerMove={(e) => {
        if (!profile.finePointer) return;
        pointer.current = { x: (e.clientX / window.innerWidth) * 2 - 1, y: -((e.clientY / window.innerHeight) * 2 - 1) };
      }}
      onPointerLeave={() => (pointer.current = { x: 0, y: 0 })}
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        {/* 3D stage */}
        <SceneMount className="absolute inset-0" fallback={<StaticFallback />} margin="200px 0px">
          {(active) => (
            <HeroScene
              active={active}
              reducedMotion={reduce}
              quality={profile.quality}
              finePointer={profile.finePointer}
              progress={progress}
              pointer={pointer}
              onReady={() => setReady(true)}
            />
          )}
        </SceneMount>
        <AnimatePresence>{!ready && <LoadingExperience key="loader" reduce={reduce} />}</AnimatePresence>

        {/* Readability scrims: from the left on desktop, from the bottom on phones */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-transparent lg:bg-gradient-to-r lg:from-ink/95 lg:via-ink/55 lg:to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink/80 to-transparent" />

        {/* Copy */}
        <motion.div style={{ opacity: copyOpacity, y: copyY }} className="container-x relative z-10 flex h-full flex-col justify-end pb-24 sm:pb-28 lg:justify-center lg:pt-16 lg:pb-0">
          <div className="max-w-[44rem]">
            <motion.p
              className="eyebrow text-blue-300"
              initial={reduce ? false : { opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
            >
              {tagline}
            </motion.p>
            <h1 id="hero-heading" className="display-hero mt-6 text-white" aria-label="Building the future. Engineering excellence.">
              <span className="block" aria-hidden="true">
                <TextReveal text="Building the" delay={0.3} />
              </span>{" "}
              <span className="block" aria-hidden="true">
                <TextReveal text="future." delay={0.42} />
              </span>{" "}
              <span className="block text-blue-300" aria-hidden="true">
                <TextReveal text="Engineering" delay={0.56} />
              </span>{" "}
              <span className="block text-blue-300" aria-hidden="true">
                <TextReveal text="excellence." delay={0.68} />
              </span>
            </h1>
            <motion.p
              className="mt-7 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg"
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.95 }}
            >
              Creating enduring spaces and infrastructure through thoughtful engineering, quality construction, and a commitment to
              excellence.
            </motion.p>
            <motion.div
              className="mt-9 flex flex-col gap-3 sm:flex-row"
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 1.1 }}
            >
              <ButtonLink to="/projects" size="lg" arrow>
                Explore Our Projects
              </ButtonLink>
              <ButtonLink to="/contact" size="lg" variant="outline-light">
                Discuss Your Project
              </ButtonLink>
            </motion.div>
          </div>
        </motion.div>

        {/* Second beat, revealed as the camera orbits */}
        {!reduce && (
          <motion.div
            style={{ opacity: captionOpacity, y: captionY }}
            className="pointer-events-none absolute inset-x-0 bottom-[16%] z-10 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2"
            aria-hidden="true"
          >
            <div className="container-x">
              <p className="eyebrow text-blue-300">Layer by layer</p>
              <p className="mt-4 max-w-xl font-display text-[clamp(1.8rem,4vw,3.2rem)] leading-[1.05] font-extrabold tracking-tight">
                Structure. Envelope. Services. Finish.
              </p>
              <p className="mt-4 max-w-md text-white/70">
                Every project is planned and coordinated as one system — from foundations to the final walkthrough.
              </p>
            </div>
          </motion.div>
        )}

        {/* Scroll guidance */}
        <motion.a
          href="#intro"
          style={{ opacity: cueOpacity }}
          className="absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-3 text-[0.68rem] font-semibold tracking-[0.28em] text-white/60 uppercase sm:flex"
          aria-label="Scroll to the introduction"
        >
          <span className="relative h-11 w-6 rounded-full ring-1 ring-white/30">
            <motion.span
              className="absolute top-2 left-1/2 h-2 w-[3px] -translate-x-1/2 rounded-full bg-blue-300"
              animate={reduce ? undefined : { y: [0, 14, 0], opacity: [1, 0.2, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            />
          </span>
          Scroll
        </motion.a>

        {/* Official logo tile */}
        <motion.div
          style={{ opacity: cueOpacity }}
          className="absolute right-6 bottom-7 z-10 hidden rounded-xl bg-white p-2.5 shadow-lift lg:block xl:right-10"
        >
          <LogoLockup priority className="w-28" />
        </motion.div>
      </div>
    </section>
  );
}
