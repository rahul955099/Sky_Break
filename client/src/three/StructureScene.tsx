/**
 * StructureScene — "wireframe to solid".
 * Scroll progress (0–1) drives a tower that first appears as royal-blue blueprint
 * linework, floor by floor, and then fills in with concrete and glass from the
 * ground up. Used by the homepage capabilities section.
 */
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Grid, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { clamp01, easeOutCubic } from "./parts";
import type { SceneQuality } from "../hooks/useDeviceProfile";

export interface StructureSceneProps {
  active: boolean;
  reducedMotion: boolean;
  quality: SceneQuality;
  progress: MutableRefObject<number>;
}

const FLOORS = 12;
const FLOOR_H = 0.42;
const W = 3.0;
const D = 2.1;
const TWIST = 0.035;

const box = new THREE.BoxGeometry(1, 1, 1);
const boxEdges = new THREE.EdgesGeometry(box);

interface FloorMaterials {
  slab: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  column: THREE.MeshStandardMaterial;
  line: THREE.LineBasicMaterial;
}

function makeFloorMaterials(): FloorMaterials {
  return {
    slab: new THREE.MeshStandardMaterial({ color: "#eceae5", roughness: 0.8, transparent: true, opacity: 0 }),
    glass: new THREE.MeshStandardMaterial({ color: "#5a7da8", metalness: 0.6, roughness: 0.08, transparent: true, opacity: 0, envMapIntensity: 1.6 }),
    column: new THREE.MeshStandardMaterial({ color: "#1d2733", roughness: 0.5, metalness: 0.4, transparent: true, opacity: 0 }),
    line: new THREE.LineBasicMaterial({ color: "#3360b5", transparent: true, opacity: 1 }),
  };
}

/** A box mesh with its blueprint edge outline. */
function Mass({ p, s, material, line }: { p: [number, number, number]; s: [number, number, number]; material: THREE.Material; line: THREE.Material }) {
  return (
    <group position={p} scale={s}>
      <mesh geometry={box} material={material} />
      <lineSegments geometry={boxEdges} material={line} />
    </group>
  );
}

function Floor({ index, progress, reducedMotion }: { index: number; progress: MutableRefObject<number>; reducedMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  const mats = useMemo(() => makeFloorMaterials(), []);
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);
  const isTop = index === FLOORS - 1;
  const w = isTop ? W - 0.4 : W;
  const d = isTop ? D - 0.3 : D;
  const y = 0.56 + index * FLOOR_H;
  const t = index / FLOORS;

  useFrame(() => {
    const p = reducedMotion ? 1 : progress.current;
    const rise = easeOutCubic(clamp01((p - 0.04 - t * 0.42) / 0.1));
    const solid = clamp01((p - 0.48 - t * 0.3) / 0.14);
    const g = group.current;
    if (g) {
      g.visible = rise > 0.001;
      g.position.y = y + (1 - rise) * 1.4;
      g.scale.setScalar(0.96 + rise * 0.04);
    }
    mats.line.opacity = rise * (1 - solid * 0.55);
    mats.slab.opacity = solid;
    mats.column.opacity = solid;
    mats.glass.opacity = solid * 0.82;
    const opaque = solid > 0.98;
    mats.slab.transparent = !opaque;
    mats.column.transparent = !opaque;
    mats.slab.depthWrite = opaque;
    mats.column.depthWrite = opaque;
  });

  const cols: [number, number][] = [
    [w / 2 - 0.12, d / 2 - 0.12],
    [-w / 2 + 0.12, d / 2 - 0.12],
    [w / 2 - 0.12, -d / 2 + 0.12],
    [-w / 2 + 0.12, -d / 2 + 0.12],
    [0, d / 2 - 0.12],
    [0, -d / 2 + 0.12],
  ];
  return (
    <group ref={group} rotation={[0, index * TWIST, 0]} position={[0, y, 0]}>
      <Mass p={[0, 0, 0]} s={[w, 0.08, d]} material={mats.slab} line={mats.line} />
      {!isTop && (
        <>
          <Mass p={[0, FLOOR_H / 2, 0]} s={[w - 0.3, FLOOR_H - 0.1, d - 0.3]} material={mats.glass} line={mats.line} />
          {cols.map(([x, z]) => (
            <Mass key={`${x}:${z}`} p={[x, FLOOR_H / 2, z]} s={[0.07, FLOOR_H - 0.08, 0.07]} material={mats.column} line={mats.line} />
          ))}
        </>
      )}
    </group>
  );
}

function Podium({ progress, reducedMotion }: { progress: MutableRefObject<number>; reducedMotion: boolean }) {
  const mats = useMemo(
    () => ({
      body: new THREE.MeshStandardMaterial({ color: "#dcd8d0", roughness: 0.85, transparent: true, opacity: 0 }),
      line: new THREE.LineBasicMaterial({ color: "#3360b5", transparent: true, opacity: 0 }),
      accent: new THREE.MeshBasicMaterial({ color: "#3360b5", toneMapped: false }),
    }),
    [],
  );
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);
  useFrame(() => {
    const p = reducedMotion ? 1 : progress.current;
    mats.line.opacity = clamp01(p / 0.06) * (1 - clamp01((p - 0.45) / 0.15) * 0.5);
    mats.body.opacity = clamp01((p - 0.45) / 0.12);
    const opaque = mats.body.opacity > 0.98;
    mats.body.transparent = !opaque;
    mats.body.depthWrite = opaque;
  });
  return (
    <group>
      <Mass p={[0.3, 0.26, 0.1]} s={[4.6, 0.52, 3.2]} material={mats.body} line={mats.line} />
      <mesh material={mats.accent} position={[0.3, 0.53, 1.71]}>
        <boxGeometry args={[4.6, 0.02, 0.02]} />
      </mesh>
    </group>
  );
}

function Rig({ progress, reducedMotion }: Pick<StructureSceneProps, "progress" | "reducedMotion">) {
  const model = useRef<THREE.Group>(null);
  const { camera, size } = useThree();
  const target = useMemo(() => new THREE.Vector3(0.2, 2.9, 0), []);
  const desired = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }, delta) => {
    const p = reducedMotion ? 0.6 : progress.current;
    const idle = reducedMotion ? 0 : Math.sin(clock.elapsedTime * 0.12) * 0.04;
    if (model.current) model.current.rotation.y = THREE.MathUtils.damp(model.current.rotation.y, -0.55 + p * 0.9 + idle, 3, delta);
    const r = size.width < 640 ? 14.5 : 12.5;
    desired.set(r * 0.62, 5.4 - p * 1.2, r * 0.78);
    camera.position.lerp(desired, reducedMotion ? 1 : 1 - Math.exp(-2.5 * delta));
    camera.lookAt(target);
  });
  return (
    <group ref={model}>
      <Podium progress={progress} reducedMotion={reducedMotion} />
      {Array.from({ length: FLOORS }, (_, i) => (
        <Floor key={i} index={i} progress={progress} reducedMotion={reducedMotion} />
      ))}
    </group>
  );
}

export default function StructureScene({ active, reducedMotion, quality, progress }: StructureSceneProps) {
  const high = quality === "high";
  return (
    <Canvas
      dpr={high ? [1, 1.6] : [1, 1.25]}
      frameloop={reducedMotion ? "demand" : active ? "always" : "never"}
      camera={{ position: [7.7, 5.4, 9.7], fov: 34 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      aria-hidden="true"
    >
      <hemisphereLight args={["#ffffff", "#c9d3e2", 0.9]} />
      <directionalLight position={[6, 10, 6]} intensity={1.6} color="#fff4e6" />
      <directionalLight position={[-6, 4, -5]} intensity={0.5} color="#9db6ea" />
      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={2} color="#ffffff" position={[0, 8, 6]} scale={[12, 4, 1]} target={[0, 2, 0]} />
        <Lightformer form="rect" intensity={1.2} color="#9db6ea" position={[-8, 3, -4]} scale={[8, 4, 1]} target={[0, 2, 0]} />
      </Environment>
      <Rig progress={progress} reducedMotion={reducedMotion} />
      <Grid
        position={[0, 0.002, 0]}
        args={[40, 40]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#c7d2e3"
        sectionSize={2.5}
        sectionThickness={0.9}
        sectionColor="#3360b5"
        fadeDistance={20}
        fadeStrength={1.8}
        infiniteGrid
      />
      {high && <ContactShadows position={[0, 0.004, 0]} opacity={0.32} scale={12} blur={2.6} far={7} resolution={512} color="#0b2740" />}
    </Canvas>
  );
}
