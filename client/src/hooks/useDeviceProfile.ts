import { useState } from "react";

export type SceneQuality = "high" | "low";

export interface DeviceProfile {
  /** WebGL is available and a context can be created. */
  webgl: boolean;
  /** A precise pointer (mouse/trackpad) — pointer-driven effects are only enabled for these. */
  finePointer: boolean;
  /** Lower-cost rendering for small screens and modest hardware. */
  quality: SceneQuality;
  /** Narrow viewport (phones). */
  compact: boolean;
}

let cachedWebgl: boolean | null = null;

export function supportsWebGL() {
  if (cachedWebgl !== null) return cachedWebgl;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    cachedWebgl = Boolean(gl);
    // Release the probe context immediately so it doesn't count against the browser's limit.
    (gl as WebGLRenderingContext | null)?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    cachedWebgl = false;
  }
  return cachedWebgl;
}

function detect(): DeviceProfile {
  if (typeof window === "undefined") return { webgl: false, finePointer: false, quality: "low", compact: true };
  const nav = navigator as Navigator & { deviceMemory?: number };
  const compact = window.innerWidth < 768;
  const modest = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
  return {
    webgl: supportsWebGL(),
    finePointer: window.matchMedia?.("(pointer: fine)").matches ?? false,
    quality: compact || modest ? "low" : "high",
    compact,
  };
}

/** Evaluated once per mount; deliberately not reactive to resizes to avoid re-creating GPU resources. */
export function useDeviceProfile() {
  const [profile] = useState(detect);
  return profile;
}
