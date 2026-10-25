import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useDeviceProfile } from "../../hooks/useDeviceProfile";

/**
 * Restrained perspective tilt toward the pointer, with an inner depth layer that
 * drifts the opposite way. Inactive on touch devices and under reduced motion.
 */
export function TiltCard({ children, className = "", max = 5 }: { children: ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { finePointer } = useDeviceProfile();
  const enabled = finePointer && !reduce;
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spring = { stiffness: 160, damping: 20, mass: 0.6 };
  const rotateY = useSpring(useTransform(px, [-1, 1], [-max, max]), spring);
  const rotateX = useSpring(useTransform(py, [-1, 1], [max, -max]), spring);

  return (
    <div style={{ perspective: 1200 }} className={className}>
      <motion.div
        ref={ref}
        style={enabled ? { rotateX, rotateY, transformStyle: "preserve-3d" } : undefined}
        className="h-full"
        onPointerMove={(e) => {
          if (!enabled || !ref.current) return;
          const r = ref.current.getBoundingClientRect();
          px.set(((e.clientX - r.left) / r.width) * 2 - 1);
          py.set(((e.clientY - r.top) / r.height) * 2 - 1);
        }}
        onPointerLeave={() => {
          px.set(0);
          py.set(0);
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
