/**
 * Procedural architecture toolkit shared by the 3D scenes.
 * Repeated elements (mullions, spandrels, balconies, window lights, lattice) are
 * drawn with InstancedMesh: one draw call per element type instead of one per box.
 */
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type Vec3 = [number, number, number];

export interface Box {
  p: Vec3;
  s: Vec3;
  /** Euler rotation in radians */
  r?: Vec3;
}

const unitBox = new THREE.BoxGeometry(1, 1, 1);

/** Draws many boxes with a single instanced draw call. */
export function InstancedBoxes({
  items,
  material,
  castShadow = false,
  receiveShadow = false,
}: {
  items: Box[];
  material: THREE.Material;
  castShadow?: boolean;
  receiveShadow?: boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    items.forEach((b, i) => {
      o.position.set(...b.p);
      o.rotation.set(...(b.r ?? [0, 0, 0]));
      o.scale.set(...b.s);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);
  if (items.length === 0) return null;
  return <instancedMesh key={items.length} ref={ref} args={[unitBox, material, items.length]} castShadow={castShadow} receiveShadow={receiveShadow} />;
}

/** Creates materials once per scene and disposes them when the scene unmounts. */
export function useMaterials<T extends Record<string, THREE.Material>>(factory: () => T): T {
  // The factory runs once per mount by design; scenes never swap their material set.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mats = useMemo(() => factory(), []);
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);
  return mats;
}

export function architectureMaterials() {
  return {
    glass: new THREE.MeshStandardMaterial({ color: "#3d5672", metalness: 0.9, roughness: 0.05, envMapIntensity: 2.2 }),
    glassLight: new THREE.MeshStandardMaterial({ color: "#4a6079", metalness: 0.82, roughness: 0.1, envMapIntensity: 1.8 }),
    concrete: new THREE.MeshStandardMaterial({ color: "#d8d4cc", roughness: 0.86, metalness: 0 }),
    concreteDark: new THREE.MeshStandardMaterial({ color: "#8d8a84", roughness: 0.9, metalness: 0 }),
    stone: new THREE.MeshStandardMaterial({ color: "#b9b2a6", roughness: 0.75, metalness: 0 }),
    steel: new THREE.MeshStandardMaterial({ color: "#c7ccd4", roughness: 0.32, metalness: 0.85 }),
    darkSteel: new THREE.MeshStandardMaterial({ color: "#252b33", roughness: 0.45, metalness: 0.7 }),
    timber: new THREE.MeshStandardMaterial({ color: "#9c6f4b", roughness: 0.7, metalness: 0 }),
    /** Royal-blue accent from the Skybreak logo, unlit so it reads as an LED line. */
    accent: new THREE.MeshBasicMaterial({ color: "#4f7fe0", toneMapped: false }),
    /** Interior light seen through glazing: additive so it glows on the glass rather than painting over it. */
    windowLight: new THREE.MeshBasicMaterial({
      color: "#ffcf8f",
      toneMapped: false,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    foliage: new THREE.MeshStandardMaterial({ color: "#2e3b31", roughness: 0.95 }),
  };
}

export type ArchMaterials = ReturnType<typeof architectureMaterials>;

/** Small deterministic PRNG so procedural layouts are identical on every render. */
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface FacadeOptions {
  width: number;
  depth: number;
  baseY: number;
  height: number;
  floorH: number;
  bays: number;
  /** Outward offset of fins from the glass */
  finDepth?: number;
}

/**
 * Curtain-wall facade for a rectangular glazed volume: floor spandrels, vertical fins
 * on every face, and one window-light panel per bay per floor (with a switch-on threshold).
 */
export function curtainWall({ width, depth, baseY, height, floorH, bays, finDepth = 0.08 }: FacadeOptions, seed = 1) {
  const rand = seeded(seed);
  const floors = Math.max(1, Math.floor(height / floorH));
  const spandrels: Box[] = [];
  const fins: Box[] = [];
  const windows: (Box & { threshold: number })[] = [];
  for (let f = 1; f <= floors; f++) {
    spandrels.push({ p: [0, baseY + f * floorH - 0.03, 0], s: [width + 0.04, 0.06, depth + 0.04] });
  }
  const faces: { axis: "x" | "z"; sign: 1 | -1; len: number }[] = [
    { axis: "z", sign: 1, len: width },
    { axis: "z", sign: -1, len: width },
    { axis: "x", sign: 1, len: depth },
    { axis: "x", sign: -1, len: depth },
  ];
  for (const face of faces) {
    const half = (face.axis === "z" ? depth : width) / 2;
    const bay = face.len / bays;
    for (let b = 0; b <= bays; b++) {
      const along = -face.len / 2 + b * bay;
      const out = face.sign * (half + finDepth / 2);
      fins.push(
        face.axis === "z"
          ? { p: [along, baseY + height / 2, out], s: [0.035, height, finDepth] }
          : { p: [out, baseY + height / 2, along], s: [finDepth, height, 0.035] },
      );
    }
    for (let f = 0; f < floors; f++) {
      for (let b = 0; b < bays; b++) {
        const along = -face.len / 2 + (b + 0.5) * bay;
        const y = baseY + f * floorH + floorH * 0.48;
        const out = face.sign * (half + 0.006);
        const w = bay * 0.82;
        const h = floorH * 0.66;
        windows.push({
          p: face.axis === "z" ? [along, y, out] : [out, y, along],
          s: face.axis === "z" ? [w, h, 0.004] : [0.004, h, w],
          threshold: rand(),
        });
      }
    }
  }
  return { spandrels, fins, windows };
}

/**
 * Instanced window-light panels that switch on as `level` (0–1) rises past each
 * panel's threshold. Matrices are only rewritten when the level changes noticeably.
 */
export function WindowLights({
  items,
  material,
  levelRef,
}: {
  items: (Box & { threshold: number })[];
  material: THREE.Material;
  levelRef: { current: number };
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const applied = useRef(-1);
  const temp = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const color = new THREE.Color();
    const rand = seeded(items.length);
    items.forEach((_, i) => {
      // Slight warm/cool variation between apartments and offices.
      color.setHSL(0.085 + rand() * 0.05, 0.55 + rand() * 0.2, 0.42 + rand() * 0.22);
      mesh.setColorAt(i, color);
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    applied.current = -1;
  }, [items]);

  // Runs inside the R3F render loop, so it pauses whenever the scene is paused.
  useFrame(() => {
    const mesh = ref.current;
    const level = levelRef.current;
    if (!mesh || Math.abs(level - applied.current) <= 0.015) return;
    items.forEach((w, i) => {
      temp.position.set(...w.p);
      const on = w.threshold < level ? 1 : 0;
      temp.scale.set(w.s[0] * on, w.s[1] * on, w.s[2] * on);
      temp.updateMatrix();
      mesh.setMatrixAt(i, temp.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    applied.current = level;
  });

  if (items.length === 0) return null;
  return <instancedMesh key={items.length} ref={ref} args={[unitBox, material, items.length]} />;
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
