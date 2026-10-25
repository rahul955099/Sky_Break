import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Reveal, TextReveal } from "../../components/ui/Reveal";
import { approachSteps } from "../../data/content";

// ── Isometric drawing helpers ──────────────────────────────────
const S = 24;
const OX = 300;
const OY = 300;
type P3 = [number, number, number];
const iso = ([x, y, z]: P3): [number, number] => [OX + (x - y) * 0.866 * S, OY + (x + y) * 0.5 * S - z * S];
const path = (...pts: P3[]) => "M" + pts.map((p) => iso(p).map((n) => n.toFixed(1)).join(" ")).join(" L");
const poly = (...pts: P3[]) => path(...pts) + " Z";
const rect = (z: number, x0: number, y0: number, x1: number, y1: number) => poly([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]);

// Building footprint and floors
const BX0 = 2;
const BX1 = 8;
const BY0 = 2;
const BY1 = 6;
const LEVELS = [3, 6, 9];

const stagePaths = {
  survey: [poly([0, 0, 0], [10, 0, 0], [10, 8, 0], [0, 8, 0])],
  grid: [
    ...[2, 4, 6, 8].map((x) => path([x, 0.6, 0], [x, 7.4, 0])),
    ...[2, 4, 6].map((y) => path([0.6, y, 0], [9.4, y, 0])),
  ],
  design: [rect(0, BX0, BY0, BX1, BY1), path([5, BY0, 0], [5, BY1, 0]), path([BX0, 4, 0], [5, 4, 0]), path([6.5, BY0, 0], [6.5, 4, 0])],
  columns: [2, 4, 6, 8].flatMap((x) => [2, 4, 6].map((y) => path([x, y, 0], [x, y, 9]))),
  slabs: LEVELS.map((z) => rect(z, BX0, BY0, BX1, BY1)),
  facade: [
    ...[1, 2, 3].flatMap((f) =>
      [0, 1, 2, 3, 4, 5].map((b) => poly([BX0 + b + 0.2, BY1, f * 3 - 2.4], [BX0 + b + 0.8, BY1, f * 3 - 2.4], [BX0 + b + 0.8, BY1, f * 3 - 0.6], [BX0 + b + 0.2, BY1, f * 3 - 0.6])),
    ),
    ...[1, 2, 3].flatMap((f) =>
      [0, 1, 2, 3].map((b) => poly([BX1, BY0 + b + 0.2, f * 3 - 2.4], [BX1, BY0 + b + 0.8, f * 3 - 2.4], [BX1, BY0 + b + 0.8, f * 3 - 0.6], [BX1, BY0 + b + 0.2, f * 3 - 0.6])),
    ),
  ],
};

const faces = {
  left: poly([BX0, BY1, 0], [BX1, BY1, 0], [BX1, BY1, 9], [BX0, BY1, 9]),
  right: poly([BX1, BY0, 0], [BX1, BY1, 0], [BX1, BY1, 9], [BX1, BY0, 9]),
  top: rect(9, BX0, BY0, BX1, BY1),
};

const pegs: P3[] = [
  [0, 0, 0],
  [10, 0, 0],
  [10, 8, 0],
  [0, 8, 0],
];
const checks: P3[] = [
  [BX1, BY1, 3],
  [5, BY1, 6],
  [BX1, 3, 9],
];

function StageGroup({ progress, index, children }: { progress: MotionValue<number>; index: number; children: (draw: MotionValue<number>) => React.ReactNode }) {
  const n = approachSteps.length;
  const draw = useTransform(progress, [index / n, (index + 0.85) / n], [0, 1]);
  return <>{children(draw)}</>;
}

function IsoStructure({ progress }: { progress: MotionValue<number> }) {
  const line = { fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="110 70 400 460" className="h-full w-full" role="img" aria-label="Isometric drawing of a building developing from site survey to completed handover">
      {/* 6 · Handover: solid faces sit beneath the linework */}
      <StageGroup progress={progress} index={5}>
        {(d) => (
          <motion.g style={{ opacity: d }}>
            <path d={faces.left} fill="#e3e7ee" />
            <path d={faces.right} fill="#cdd4df" />
            <path d={faces.top} fill="#f6f7fa" />
            {stagePaths.facade.map((p, i) => (
              <path key={i} d={p} fill={i % 3 === 0 ? "#ffd59a" : "#9fb3cf"} opacity={0.9} />
            ))}
          </motion.g>
        )}
      </StageGroup>

      {/* 1 · Consultation: site boundary and survey pegs */}
      <StageGroup progress={progress} index={0}>
        {(d) => (
          <g>
            <motion.path d={stagePaths.survey[0]} stroke="#3360b5" strokeWidth={1.6} strokeDasharray="6 6" style={{ pathLength: d }} {...line} />
            {pegs.map((p, i) => {
              const [x, y] = iso(p);
              return <motion.circle key={i} cx={x} cy={y} r={4} fill="#3360b5" style={{ opacity: d }} />;
            })}
          </g>
        )}
      </StageGroup>

      {/* 2 · Planning: structural grid */}
      <StageGroup progress={progress} index={1}>
        {(d) => (
          <g>
            {stagePaths.grid.map((p, i) => (
              <motion.path key={i} d={p} stroke="#9aaac2" strokeWidth={1} strokeDasharray="3 5" style={{ pathLength: d }} {...line} />
            ))}
          </g>
        )}
      </StageGroup>

      {/* 3 · Design coordination: footprint and room layout */}
      <StageGroup progress={progress} index={2}>
        {(d) => (
          <g>
            {stagePaths.design.map((p, i) => (
              <motion.path key={i} d={p} stroke={i === 0 ? "#123b5d" : "#3360b5"} strokeWidth={i === 0 ? 2.2 : 1.3} style={{ pathLength: d }} {...line} />
            ))}
          </g>
        )}
      </StageGroup>

      {/* 4 · Construction: columns and slabs */}
      <StageGroup progress={progress} index={3}>
        {(d) => (
          <g>
            {stagePaths.columns.map((p, i) => (
              <motion.path key={i} d={p} stroke="#123b5d" strokeWidth={1.8} style={{ pathLength: d }} {...line} />
            ))}
            {stagePaths.slabs.map((p, i) => (
              <motion.path key={i} d={p} stroke="#123b5d" strokeWidth={2} style={{ pathLength: d }} {...line} />
            ))}
          </g>
        )}
      </StageGroup>

      {/* 5 · Quality checks: facade panels and inspection markers */}
      <StageGroup progress={progress} index={4}>
        {(d) => (
          <g>
            {stagePaths.facade.map((p, i) => (
              <motion.path key={i} d={p} stroke="#5d7290" strokeWidth={0.9} style={{ pathLength: d }} {...line} />
            ))}
            {checks.map((p, i) => {
              const [x, y] = iso(p);
              return (
                <motion.g key={i} style={{ opacity: d }}>
                  <circle cx={x + 18} cy={y - 14} r={11} fill="#3360b5" />
                  <path d={`M${x + 13} ${y - 14} l4 4 l7 -8`} stroke="#fff" strokeWidth={2} {...line} />
                </motion.g>
              );
            })}
          </g>
        )}
      </StageGroup>

      {/* 6 · Handover: roof parapet line and marker */}
      <StageGroup progress={progress} index={5}>
        {(d) => {
          const [fx, fy] = iso([BX0 + 0.6, BY0 + 0.6, 9]);
          return (
            <motion.g style={{ opacity: d }}>
              <path d={faces.top} fill="none" stroke="#123b5d" strokeWidth={2.4} />
              <path d={`M${fx} ${fy} V${fy - 46}`} stroke="#123b5d" strokeWidth={2} />
              <path d={`M${fx} ${fy - 46} h30 l-8 8 l8 8 h-30`} fill="#3360b5" />
            </motion.g>
          );
        }}
      </StageGroup>
    </svg>
  );
}

export function ProcessBuild() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.6", "end end"] });
  const progress = useTransform(scrollYProgress, (v) => (reduce ? 1 : v));
  const [step, setStep] = useState(reduce ? approachSteps.length - 1 : 0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (!reduce) setStep(Math.min(approachSteps.length - 1, Math.floor(v * approachSteps.length)));
  });

  return (
    <section ref={ref} className="relative bg-paper lg:h-[240vh]" aria-labelledby="approach-heading">
      <div className="relative lg:sticky lg:top-0 lg:h-svh">
        <div className="container-x grid h-full items-center gap-12 py-24 lg:grid-cols-12 lg:py-0">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="eyebrow">Our approach</p>
            </Reveal>
            <h2 id="approach-heading" className="display-lg mt-5">
              <TextReveal text="Six steps from first idea to handover." />
            </h2>
            <ol className="mt-10 space-y-2">
              {approachSteps.map((s, i) => {
                const on = i === step;
                const done = i < step;
                return (
                  <li key={s.title} className="flex gap-4">
                    <span
                      className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-sm font-extrabold transition-colors duration-500 ${
                        on ? "bg-blue text-white" : done ? "bg-ink text-white" : "bg-white text-muted ring-1 ring-line"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className={`pb-3 transition-opacity duration-500 ${on || done ? "opacity-100" : "lg:opacity-50"}`}>
                      <h3 className="font-display text-lg font-bold">{s.title}</h3>
                      <p className={`mt-1 text-[0.95rem] leading-relaxed text-muted ${on ? "" : "lg:hidden"}`}>{s.text}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <Link to="/process" className="mt-8 inline-flex items-center gap-2 font-semibold text-blue hover:underline">
              See the full process <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="lg:col-span-7">
            <div className="relative mx-auto aspect-[400/460] max-h-[80vh] w-full max-w-[620px]">
              <IsoStructure progress={progress} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
