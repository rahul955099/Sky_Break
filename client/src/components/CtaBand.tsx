import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { images } from "../data/images";
import { ButtonLink } from "./ui/Button";
import { Img } from "./ui/Img";
import { Reveal } from "./ui/Reveal";

export function CtaBand({
  title = "Have a project in mind? Let's build it properly.",
  text = "Tell us about your plans. We'll listen, ask the right questions and help you understand the next steps — with no obligation.",
}: {
  title?: string;
  text?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-12%", "12%"]);

  return (
    <section ref={ref} className="container-x py-16 sm:py-24" aria-labelledby="cta-heading">
      <div className="relative isolate overflow-hidden rounded-[32px] bg-navy px-6 py-16 sm:px-14 sm:py-24">
        <motion.div style={{ y }} className="absolute inset-[-15%] -z-10">
          <Img src={images.cta} alt="" width={2000} frameClassName="h-full w-full" />
        </motion.div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950/95 via-navy/85 to-navy/40" />
        <div className="bg-blueprint-dark absolute inset-0 -z-10" aria-hidden="true" />
        <Reveal className="max-w-2xl">
          <p className="eyebrow text-[#8fb3ff]">Start your project</p>
          <h2 id="cta-heading" className="display-lg mt-4 text-white">
            {title}
          </h2>
          <p className="lead mt-6 text-white/75">{text}</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to="/contact" size="lg" arrow>
              Start Your Project
            </ButtonLink>
            <ButtonLink to="/process" size="lg" variant="outline-light">
              See how we work
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
