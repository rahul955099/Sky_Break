/**
 * ServiceScene — one canvas, one miniature architectural model per service.
 * The active model scales up on a slowly turning pedestal while the previous one
 * recedes, so switching services never creates a new WebGL context.
 */
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { architectureMaterials, curtainWall, InstancedBoxes, seeded, useMaterials, type ArchMaterials, type Box } from "./parts";
import type { SceneQuality } from "../hooks/useDeviceProfile";
import { ALL_KINDS, type ServiceModelKind } from "./serviceKinds";

type MatKey = keyof ArchMaterials | "water";
interface Part {
  p: [number, number, number];
  s: [number, number, number];
  m: MatKey;
}

const box = new THREE.BoxGeometry(1, 1, 1);
const boxEdges = new THREE.EdgesGeometry(box);

function Masses({ parts, mats, line }: { parts: Part[]; mats: Record<MatKey, THREE.Material>; line: THREE.Material }) {
  return (
    <>
      {parts.map((part, i) => (
        <group key={i} position={part.p} scale={part.s}>
          <mesh geometry={box} material={mats[part.m]} castShadow receiveShadow />
          {part.m !== "glass" && part.m !== "glassLight" && <lineSegments geometry={boxEdges} material={line} />}
        </group>
      ))}
    </>
  );
}

function buildModel(kind: ServiceModelKind): { parts: Part[]; instanced: { items: Box[]; m: MatKey }[] } {
  const instanced: { items: Box[]; m: MatKey }[] = [];
  switch (kind) {
    case "house":
      return {
        parts: [
          { p: [0, 0.45, 0], s: [2.2, 0.9, 1.6], m: "concrete" },
          { p: [0, 0.45, 0.81], s: [1.9, 0.62, 0.02], m: "glass" },
          { p: [0.35, 1.25, -0.1], s: [1.8, 0.7, 1.4], m: "concrete" },
          { p: [0.35, 1.25, 0.61], s: [1.5, 0.46, 0.02], m: "glass" },
          { p: [0.35, 1.64, -0.1], s: [1.96, 0.08, 1.56], m: "concreteDark" },
          { p: [-0.62, 0.93, 0.25], s: [0.95, 0.04, 1.1], m: "timber" },
        ],
        instanced,
      };
    case "villa": {
      const slats: Box[] = [];
      for (let i = 0; i < 9; i++) slats.push({ p: [0.6 + i * 0.12, 0.82, 0.95], s: [0.04, 0.04, 0.9] });
      instanced.push({ items: slats, m: "timber" });
      return {
        parts: [
          { p: [0, 0.35, -0.1], s: [2.8, 0.7, 1.4], m: "concrete" },
          { p: [0, 0.35, 0.61], s: [2.5, 0.52, 0.02], m: "glass" },
          { p: [0.2, 0.74, 0], s: [3.2, 0.08, 1.8], m: "concrete" },
          { p: [-0.7, 1.08, -0.25], s: [1.2, 0.6, 1.0], m: "concrete" },
          { p: [-0.7, 1.08, 0.26], s: [1.0, 0.42, 0.02], m: "glass" },
          { p: [-0.1, 0.03, 1.3], s: [2.4, 0.04, 0.75], m: "water" },
        ],
        instanced,
      };
    }
    case "apartments": {
      const balconies: Box[] = [];
      for (let f = 0; f < 7; f++) for (const x of [-0.55, 0, 0.55]) balconies.push({ p: [x, 0.5 + f * 0.4, 0.72], s: [0.46, 0.04, 0.24] });
      instanced.push({ items: balconies, m: "concrete" });
      return {
        parts: [
          { p: [0, 1.5, 0], s: [1.8, 3.0, 1.2], m: "concrete" },
          { p: [0, 1.6, 0], s: [1.66, 2.7, 1.25], m: "glassLight" },
          { p: [0, 3.05, 0], s: [1.9, 0.1, 1.3], m: "concreteDark" },
        ],
        instanced,
      };
    }
    case "tower": {
      const cw = curtainWall({ width: 1.2, depth: 1.2, baseY: 0.32, height: 3.6, floorH: 0.36, bays: 3, finDepth: 0.05 }, 3);
      instanced.push({ items: cw.spandrels, m: "steel" }, { items: cw.fins, m: "steel" });
      return {
        parts: [
          { p: [0, 0.16, 0], s: [2.0, 0.32, 1.8], m: "stone" },
          { p: [0, 0.32 + 1.8, 0], s: [1.2, 3.6, 1.2], m: "glass" },
          { p: [0, 3.96, 0], s: [1.26, 0.06, 1.26], m: "concrete" },
          { p: [0, 3.93, 0], s: [1.24, 0.02, 1.24], m: "accent" },
        ],
        instanced,
      };
    }
    case "retail":
      return {
        parts: [
          { p: [0, 0.6, -0.1], s: [2.6, 1.2, 1.5], m: "concrete" },
          { p: [0, 0.42, 0.66], s: [2.4, 0.7, 0.02], m: "glass" },
          { p: [0, 0.95, 0.88], s: [2.8, 0.06, 0.48], m: "concreteDark" },
          { p: [0, 1.06, 0.66], s: [1.2, 0.07, 0.02], m: "accent" },
        ],
        instanced,
      };
    case "district": {
      const mast: Box[] = [
        { p: [1.35, 1.9, -0.9], s: [0.06, 3.8, 0.06] },
        { p: [0.75, 3.8, -0.9], s: [1.8, 0.05, 0.05] },
      ];
      instanced.push({ items: mast, m: "steel" });
      return {
        parts: [
          { p: [-0.9, 1.2, -0.4], s: [0.8, 2.4, 0.8], m: "glass" },
          { p: [0.25, 0.8, -0.6], s: [0.9, 1.6, 0.9], m: "concrete" },
          { p: [0.85, 1.6, 0.5], s: [0.7, 3.2, 0.7], m: "glass" },
          { p: [-0.45, 0.4, 0.7], s: [1.2, 0.8, 0.6], m: "concrete" },
          { p: [0.85, 3.22, 0.5], s: [0.72, 0.03, 0.72], m: "accent" },
        ],
        instanced,
      };
    }
    case "structure": {
      const pads: Box[] = [];
      const columns: Box[] = [];
      for (const x of [-0.9, 0, 0.9]) for (const z of [-0.7, 0, 0.7]) {
        pads.push({ p: [x, 0.05, z], s: [0.36, 0.1, 0.36] });
        columns.push({ p: [x, 1.25, z], s: [0.08, 2.4, 0.08] });
      }
      instanced.push({ items: pads, m: "concreteDark" }, { items: columns, m: "concrete" });
      return {
        parts: [
          { p: [0, 0.82, 0], s: [2.1, 0.06, 1.7], m: "concrete" },
          { p: [0, 1.64, 0], s: [2.1, 0.06, 1.7], m: "concrete" },
          { p: [-0.45, 2.46, 0], s: [1.2, 0.06, 1.7], m: "concrete" },
        ],
        instanced,
      };
    }
    case "renovation": {
      const poles: Box[] = [];
      const ledgers: Box[] = [];
      for (let x = -1.1; x <= 1.11; x += 0.55) poles.push({ p: [x, 0.95, 0.95], s: [0.025, 1.9, 0.025] }, { p: [x, 0.95, 1.2], s: [0.025, 1.9, 0.025] });
      for (const y of [0.62, 1.24, 1.86]) ledgers.push({ p: [0, y, 0.95], s: [2.25, 0.025, 0.025] }, { p: [0, y, 1.2], s: [2.25, 0.025, 0.025] });
      const boards: Box[] = [0.62, 1.24].map((y) => ({ p: [0, y + 0.02, 1.075], s: [2.2, 0.02, 0.24] }));
      instanced.push({ items: poles, m: "steel" }, { items: ledgers, m: "steel" }, { items: boards, m: "timber" });
      return {
        parts: [
          { p: [0, 0.75, 0], s: [2.1, 1.5, 1.6], m: "concrete" },
          { p: [0.3, 0.75, 0.81], s: [0.8, 0.9, 0.02], m: "glass" },
          { p: [0, 1.55, 0], s: [2.2, 0.1, 1.7], m: "concreteDark" },
        ],
        instanced,
      };
    }
    case "masterplan": {
      const rand = seeded(5);
      const blocks: Box[] = [];
      for (let i = 0; i < 14; i++) {
        const x = -1.2 + (i % 5) * 0.6 + (rand() - 0.5) * 0.1;
        const z = -0.8 + Math.floor(i / 5) * 0.75;
        const h = 0.15 + rand() * 0.9;
        if (Math.abs(x) < 0.25 && Math.abs(z) < 0.3) continue;
        blocks.push({ p: [x, 0.06 + h / 2, z], s: [0.36, h, 0.4] });
      }
      instanced.push({ items: blocks, m: "concrete" });
      return {
        parts: [
          { p: [0, 0.03, 0], s: [3.2, 0.06, 2.4], m: "stone" },
          { p: [0, 0.065, 0.37], s: [3.2, 0.012, 0.16], m: "darkSteel" },
          { p: [-0.3, 0.065, 0], s: [0.14, 0.012, 2.4], m: "darkSteel" },
          { p: [0.15, 0.09, -0.05], s: [0.5, 0.05, 0.5], m: "foliage" },
        ],
        instanced,
      };
    }
  }
}

function Model({ kind, activeRef, mats, line }: { kind: ServiceModelKind; activeRef: MutableRefObject<ServiceModelKind>; mats: Record<MatKey, THREE.Material>; line: THREE.Material }) {
  const group = useRef<THREE.Group>(null);
  const model = useMemo(() => buildModel(kind), [kind]);
  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const target = activeRef.current === kind ? 1 : 0;
    const s = THREE.MathUtils.damp(g.scale.x, target, 6, delta);
    g.scale.setScalar(s);
    g.position.y = (1 - s) * -0.6;
    g.visible = s > 0.01;
  });
  return (
    <group ref={group} scale={0}>
      <Masses parts={model.parts} mats={mats} line={line} />
      {model.instanced.map((inst, i) => (
        <InstancedBoxes key={i} items={inst.items} material={mats[inst.m]} castShadow />
      ))}
    </group>
  );
}

export interface ServiceSceneProps {
  active: boolean;
  reducedMotion: boolean;
  quality: SceneQuality;
  kind: ServiceModelKind;
  pointer: MutableRefObject<{ x: number; y: number }>;
}

function Stage({ kind, reducedMotion, pointer }: Pick<ServiceSceneProps, "kind" | "reducedMotion" | "pointer">) {
  const base = useMaterials(architectureMaterials);
  const extra = useMaterials(() => ({
    water: new THREE.MeshStandardMaterial({ color: "#3f78d1", metalness: 0.3, roughness: 0.05, envMapIntensity: 2 }),
    line: new THREE.LineBasicMaterial({ color: "#8fb0ea", transparent: true, opacity: 0.55 }),
    pedestal: new THREE.MeshStandardMaterial({ color: "#1c232d", roughness: 0.6, metalness: 0.3 }),
    // Lighter "presentation model" glazing so windows read against the dark stage.
    displayGlass: new THREE.MeshStandardMaterial({ color: "#7d9cc4", metalness: 0.55, roughness: 0.08, envMapIntensity: 1.8 }),
  }));
  const mats = useMemo(
    () => ({ ...base, glass: extra.displayGlass, glassLight: extra.displayGlass, water: extra.water }) as Record<MatKey, THREE.Material>,
    [base, extra],
  );
  const activeRef = useRef(kind);
  useEffect(() => {
    activeRef.current = kind;
  }, [kind]);
  const turntable = useRef<THREE.Group>(null);

  useFrame(({ clock }, delta) => {
    const g = turntable.current;
    if (!g) return;
    const t = clock.elapsedTime;
    const ptr = pointer.current;
    g.rotation.y = reducedMotion ? -0.6 : -0.6 + t * 0.12 + ptr.x * 0.25;
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, reducedMotion ? 0 : -ptr.y * 0.08, 4, delta);
  });

  return (
    <group ref={turntable} position={[0, -1.1, 0]}>
      <mesh material={extra.pedestal} position={[0, -0.07, 0]} receiveShadow>
        <cylinderGeometry args={[2.55, 2.65, 0.14, 64]} />
      </mesh>
      {/* thin royal-blue edge line around the plinth */}
      <mesh material={base.accent} position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.47, 2.53, 128]} />
      </mesh>
      {ALL_KINDS.map((k) => (
        <Model key={k} kind={k} activeRef={activeRef} mats={mats} line={extra.line} />
      ))}
    </group>
  );
}

export default function ServiceScene({ active, reducedMotion, quality, kind, pointer }: ServiceSceneProps) {
  const high = quality === "high";
  return (
    <Canvas
      shadows={high ? "percentage" : false}
      dpr={high ? [1, 1.6] : [1, 1.25]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [7.4, 4.6, 8.8], fov: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ camera }) => camera.lookAt(0, 0.35, 0)}
      aria-hidden="true"
    >
      <hemisphereLight args={["#9db6ea", "#0a0d12", 0.55]} />
      <directionalLight position={[-4, 7, 5]} intensity={2.2} color="#ffe2c4" castShadow={high} shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} />
      <directionalLight position={[5, 3, -4]} intensity={1.1} color="#3360b5" />
      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={2.4} color="#ffd2a6" position={[-5, 4, 5]} scale={[8, 3, 1]} target={[0, 1, 0]} />
        <Lightformer form="rect" intensity={1.6} color="#3360b5" position={[6, 4, -4]} scale={[6, 4, 1]} target={[0, 1, 0]} />
      </Environment>
      <Stage kind={kind} reducedMotion={reducedMotion} pointer={pointer} />
      {!high && <ContactShadows position={[0, -1.09, 0]} opacity={0.5} scale={7} blur={2.4} far={4} resolution={256} frames={1} />}
    </Canvas>
  );
}
