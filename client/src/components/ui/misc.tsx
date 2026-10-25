import { useId, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CircleAlert, LoaderCircle, Minus, Plus, RotateCcw } from "lucide-react";
import { Reveal } from "./Reveal";

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  dark,
  as: H = "h2",
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  dark?: boolean;
  as?: "h1" | "h2";
  className?: string;
}) {
  const center = align === "center";
  return (
    <Reveal className={`${center ? "mx-auto text-center" : ""} max-w-3xl ${className}`}>
      {eyebrow && <p className={`eyebrow ${dark ? "text-[#8fb3ff]" : ""} ${center ? "justify-center" : ""}`}>{eyebrow}</p>}
      <H className={`display-lg mt-4 ${dark ? "text-white" : ""}`}>{title}</H>
      {lead && <p className={`lead mt-5 ${dark ? "text-white/70" : ""}`}>{lead}</p>}
    </Reveal>
  );
}

export function Badge({ children, tone = "default", className = "" }: { children: ReactNode; tone?: "default" | "sample" | "blue" | "dark"; className?: string }) {
  const tones = {
    default: "bg-white/90 text-charcoal ring-line",
    sample: "bg-gold/15 text-[#7a5d2b] ring-gold/40",
    blue: "bg-blue-50 text-blue ring-blue/20",
    dark: "bg-navy-950/70 text-white ring-white/15 backdrop-blur",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.72rem] font-semibold ring-1 ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function SampleBadge({ className = "" }: { className?: string }) {
  return (
    <Badge tone="sample" className={className}>
      Illustrative sample
    </Badge>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-muted">
      <LoaderCircle className="h-5 w-5 animate-spin text-blue" aria-hidden="true" />
      <span className="text-sm">{label}…</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border border-line bg-paper px-6 py-12 text-center">
      <CircleAlert className="h-8 w-8 text-red-500" aria-hidden="true" />
      <p className="text-charcoal">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="inline-flex items-center gap-2 text-sm font-semibold text-blue hover:underline">
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-14 text-center">
      <p className="font-display text-lg font-bold">{title}</p>
      {text && <p className="text-muted">{text}</p>}
      {action}
    </div>
  );
}

export function Accordion({ items, defaultOpen = 0 }: { items: { question: string; answer: string }[]; defaultOpen?: number | null }) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const base = useId();
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item, i) => {
        const isOpen = open === i;
        const id = `${base}-${i}`;
        return (
          <div key={item.question}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`${id}-panel`}
                id={`${id}-btn`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-start justify-between gap-6 py-5 text-left font-display text-[1.05rem] font-semibold text-charcoal transition-colors hover:text-blue sm:text-lg"
              >
                {item.question}
                <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ring-1 transition-colors ${isOpen ? "bg-blue text-white ring-blue" : "ring-line"}`}>
                  {isOpen ? <Minus className="h-3.5 w-3.5" aria-hidden="true" /> : <Plus className="h-3.5 w-3.5" aria-hidden="true" />}
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`${id}-panel`}
                  role="region"
                  aria-labelledby={`${id}-btn`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="max-w-3xl pb-6 leading-relaxed text-muted">{item.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
