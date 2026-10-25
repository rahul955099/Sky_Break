import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { imageSrc } from "../../lib/format";

interface Props {
  images: { url: string; alt: string }[];
  index: number | null;
  onChange: (index: number | null) => void;
}

/** Accessible modal gallery: keyboard arrows, Escape, swipe, focus trap and focus return. */
export function Lightbox({ images, index, onChange }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);
  const open = index !== null;
  const count = images.length;

  const go = useCallback(
    (delta: number) => index !== null && onChange((index + delta + count) % count),
    [index, count, onChange],
  );

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onChange(null);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Tab" && dialogRef.current) {
        const f = dialogRef.current.querySelectorAll<HTMLElement>("button");
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus();
    };
  }, [open, go, onChange]);

  const current = index !== null ? images[index] : undefined;

  return createPortal(
    <AnimatePresence>
      {open && current && (
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Image gallery"
          className="fixed inset-0 z-[100] flex flex-col bg-navy-950/95 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
          onTouchEnd={(e) => {
            const start = touchX.current;
            const end = e.changedTouches[0]?.clientX;
            if (start != null && end != null && Math.abs(end - start) > 50) go(end < start ? 1 : -1);
            touchX.current = null;
          }}
        >
          <div className="flex items-center justify-between px-4 py-4 text-white/80 sm:px-8">
            <span className="text-sm tabular-nums" aria-live="polite">
              {index! + 1} / {count}
            </span>
            <button
              ref={closeRef}
              onClick={() => onChange(null)}
              className="grid h-11 w-11 place-items-center rounded-full ring-1 ring-white/20 transition hover:bg-white/10"
              aria-label="Close gallery"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6 sm:px-20" onClick={() => onChange(null)}>
            <AnimatePresence mode="wait">
              <motion.img
                key={current.url}
                src={imageSrc(current.url, 2000)}
                alt={current.alt}
                onClick={(e) => e.stopPropagation()}
                className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
              />
            </AnimatePresence>
            {count > 1 && (
              <>
                <button
                  onClick={(e) => (e.stopPropagation(), go(-1))}
                  className="absolute left-2 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-6"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => (e.stopPropagation(), go(1))}
                  className="absolute right-2 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-6"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
          <p className="px-6 pb-6 text-center text-sm text-white/70">{current.alt}</p>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
