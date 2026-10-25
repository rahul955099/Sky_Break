/**
 * ArchitecturalHeroScene — a procedural dusk city block for the homepage hero.
 *
 * Composition: a glass office tower (stone podium, curtain wall, concrete blade,
 * setback crown with a royal-blue LED line), a residential block with balconies,
 * a cantilevered pavilion, a tower crane, landscaped plaza and a fogged city beyond.
 *
 * Motion (all disabled under reduced motion):
 *  - entrance dolly as the camera settles,
 *  - restrained pointer parallax (fine pointers only),
 *  - scroll-linked orbit/rise revealing new angles,
 *  - window lights switching on as the evening progresses.
 *
 * No external models, textures or HDR files are loaded.
 */
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import {
  architectureMaterials,
  clamp01,
  curtainWall,
  easeOutCubic,
  InstancedBoxes,
  seeded,
  useMaterials,
  WindowLights,
  type ArchMaterials,
  type Box,
} from "./parts";
import type { SceneQuality } from "../hooks/useDeviceProfile";

export interface HeroSceneProps {
  active: boolean;
  reducedMotion: boolean;
  quality: SceneQuality;
  finePointer: boolean;
  /** Scroll progress through the hero, 0–1 */
  progress: MutableRefObject<number>;
  /** Normalised pointer position, -1–1 */
  pointer: MutableRefObject<{ x: number; y: number }>;
  onReady?: () => void;
}

const BG = "#0a0d12";

// ── Buildings ──────────────────────────────────────────────────

function HeroTower({ m, level, quality }: { m: ArchMaterials; level: MutableRefObject<number>; quality: SceneQuality }) {
  const shaft = useMemo(
    () => curtainWall({ width: 2.6, depth: 2.6, baseY: 1.2, height: 6.3, floorH: 0.35, bays: quality === "high" ? 6 : 4 }, 7),
    [quality],
  );
  const crown = useMemo(() => curtainWall({ width: 2.0, depth: 2.0, baseY: 7.56, height: 1.36, floorH: 0.34, bays: 4 }, 11), []);
  const lobbyPosts = useMemo(() => {
    const posts: Box[] = [];
    for (let x = -2.05; x <= 2.06; x += 0.68) {
      posts.push({ p: [x, 0.6, 1.66], s: [0.05, 0.92, 0.05] }, { p: [x, 0.6, -1.66], s: [0.05, 0.92, 0.05] });
    }
    for (let z = -1.36; z <= 1.37; z += 0.68) {
      posts.push({ p: [2.16, 0.6, z], s: [0.05, 0.92, 0.05] }, { p: [-2.16, 0.6, z], s: [0.05, 0.92, 0.05] });
    }
    return posts;
  }, []);
  const crownFrame = useMemo<Box[]>(
    () => [
      ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => ({ p: [sx * 1.0, 9.4, sz * 1.0], s: [0.08, 0.8, 0.08] }) as Box)),
      { p: [0, 9.82, 1.0], s: [2.08, 0.08, 0.08] },
      { p: [0, 9.82, -1.0], s: [2.08, 0.08, 0.08] },
      { p: [1.0, 9.82, 0], s: [0.08, 0.08, 2.08] },
      { p: [-1.0, 9.82, 0], s: [0.08, 0.08, 2.08] },
    ],
    [],
  );

  return (
    <group>
      {/* podium */}
      <mesh material={m.stone} position={[0, 0.07, 0]} receiveShadow castShadow>
        <boxGeometry args={[4.8, 0.14, 3.8]} />
      </mesh>
      <mesh material={m.glassLight} position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[4.3, 0.92, 3.3]} />
      </mesh>
      <InstancedBoxes items={lobbyPosts} material={m.darkSteel} />
      <mesh material={m.concrete} position={[0, 1.13, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.9, 0.14, 3.9]} />
      </mesh>

      {/* glazed shaft with curtain wall */}
      <mesh material={m.glass} position={[0, 1.2 + 6.3 / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 6.3, 2.6]} />
      </mesh>
      <InstancedBoxes items={shaft.spandrels} material={m.steel} castShadow />
      <InstancedBoxes items={shaft.fins} material={m.steel} castShadow />
      <WindowLights items={shaft.windows} material={m.windowLight} levelRef={level} />

      {/* concrete blade with a vertical royal-blue LED line */}
      <mesh material={m.concrete} position={[-1.42, 1.2 + 3.95, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.24, 7.9, 1.2]} />
      </mesh>
      <mesh material={m.accent} position={[-1.545, 1.2 + 3.95, 0.61]}>
        <boxGeometry args={[0.02, 7.9, 0.02]} />
      </mesh>

      {/* transfer slab, setback and crown */}
      <mesh material={m.concrete} position={[0, 7.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.74, 0.12, 2.74]} />
      </mesh>
      <mesh material={m.glass} position={[0, 7.56 + 0.68, 0]} castShadow>
        <boxGeometry args={[2.0, 1.36, 2.0]} />
      </mesh>
      <InstancedBoxes items={crown.spandrels} material={m.steel} />
      <InstancedBoxes items={crown.fins} material={m.steel} />
      <WindowLights items={crown.windows} material={m.windowLight} levelRef={level} />
      <mesh material={m.accent} position={[0, 8.93, 0]}>
        <boxGeometry args={[2.06, 0.025, 2.06]} />
      </mesh>
      <mesh material={m.concrete} position={[0, 8.98, 0]} castShadow>
        <boxGeometry args={[2.12, 0.1, 2.12]} />
      </mesh>
      <InstancedBoxes items={crownFrame} material={m.concrete} castShadow />
      <mesh material={m.concreteDark} position={[0.2, 9.2, -0.2]} castShadow>
        <boxGeometry args={[0.9, 0.35, 0.7]} />
      </mesh>
    </group>
  );
}

function ResidentialBlock({ m, level }: { m: ArchMaterials; level: MutableRefObject<number> }) {
  const parts = useMemo(() => {
    const rand = seeded(23);
    const slabs: Box[] = [];
    const balconies: Box[] = [];
    const rails: Box[] = [];
    const railTops: Box[] = [];
    const windows: (Box & { threshold: number })[] = [];
    for (let f = 0; f < 11; f++) {
      const y = 0.62 + f * 0.42;
      slabs.push({ p: [0, y, 0], s: [3.06, 0.06, 2.1] });
      for (const x of [-1.0, 0, 1.0]) {
        balconies.push({ p: [x, y + 0.03, 1.24], s: [0.84, 0.06, 0.42] });
        rails.push({ p: [x, y + 0.17, 1.44], s: [0.84, 0.22, 0.012] });
        railTops.push({ p: [x, y + 0.29, 1.44], s: [0.86, 0.02, 0.03] });
        if (f < 10) {
          windows.push({ p: [x, y + 0.22, 1.036], s: [0.66, 0.26, 0.004], threshold: rand() });
          windows.push({ p: [x, y + 0.22, -1.036], s: [0.66, 0.26, 0.004], threshold: rand() });
        }
      }
    }
    return { slabs, balconies, rails, railTops, windows };
  }, []);
  return (
    <group position={[-5.4, 0, -2.6]} rotation={[0, 0.22, 0]}>
      <mesh material={m.concrete} position={[0, 2.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.0, 5.4, 1.9]} />
      </mesh>
      <mesh material={m.glassLight} position={[0, 2.85, 0]}>
        <boxGeometry args={[2.8, 4.7, 2.06]} />
      </mesh>
      <InstancedBoxes items={parts.slabs} material={m.concrete} castShadow />
      <InstancedBoxes items={parts.balconies} material={m.concrete} castShadow />
      <InstancedBoxes items={parts.rails} material={m.glassLight} />
      <InstancedBoxes items={parts.railTops} material={m.steel} />
      <WindowLights items={parts.windows} material={m.windowLight} levelRef={level} />
      <mesh material={m.concreteDark} position={[0, 5.46, 0]} castShadow>
        <boxGeometry args={[3.1, 0.14, 2.0]} />
      </mesh>
    </group>
  );
}

function Pavilion({ m, level }: { m: ArchMaterials; level: MutableRefObject<number> }) {
  const parts = useMemo(() => {
    const rand = seeded(41);
    const windows: (Box & { threshold: number })[] = [];
    for (let i = 0; i < 6; i++) windows.push({ p: [-1.5 + i * 0.6, 0.45, 1.206], s: [0.5, 0.5, 0.004], threshold: rand() * 0.6 });
    for (let i = 0; i < 5; i++) windows.push({ p: [-1.5 + i * 0.6, 1.22, 1.006], s: [0.5, 0.42, 0.004], threshold: rand() * 0.8 });
    const posts: Box[] = [
      { p: [2.25, 1.2, 1.36], s: [0.05, 0.72, 0.05] },
      { p: [2.25, 1.2, -1.36], s: [0.05, 0.72, 0.05] },
    ];
    return { windows, posts };
  }, []);
  return (
    <group position={[5.8, 0, 1.1]} rotation={[0, -0.34, 0]}>
      <mesh material={m.stone} position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[4.4, 0.1, 3.1]} />
      </mesh>
      <mesh material={m.glassLight} position={[0, 0.46, 0]} castShadow>
        <boxGeometry args={[3.6, 0.72, 2.4]} />
      </mesh>
      <mesh material={m.concrete} position={[0, 0.88, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.0, 0.12, 2.8]} />
      </mesh>
      <mesh material={m.glassLight} position={[-0.3, 1.23, 0]} castShadow>
        <boxGeometry args={[3.0, 0.6, 2.0]} />
      </mesh>
      <mesh material={m.timber} position={[0.2, 1.515, 0]}>
        <boxGeometry args={[4.3, 0.02, 2.9]} />
      </mesh>
      <mesh material={m.concrete} position={[0.2, 1.58, 0]} castShadow>
        <boxGeometry args={[4.4, 0.12, 3.0]} />
      </mesh>
      <InstancedBoxes items={parts.posts} material={m.darkSteel} />
      <WindowLights items={parts.windows} material={m.windowLight} levelRef={level} />
    </group>
  );
}

function Crane({ reducedMotion }: { reducedMotion: boolean }) {
  const jib = useRef<THREE.Group>(null);
  const beacon = useRef<THREE.Mesh>(null);
  const mats = useMaterials(() => ({
    paint: new THREE.MeshStandardMaterial({ color: "#e2e5e9", metalness: 0.35, roughness: 0.45 }),
    weight: new THREE.MeshStandardMaterial({ color: "#6f7379", roughness: 0.9 }),
    red: new THREE.MeshBasicMaterial({ color: "#ff3b30", toneMapped: false }),
  }));
  const H = 11.4;
  const lattice = useMemo(() => {
    const b: Box[] = [];
    const w = 0.34;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.push({ p: [(sx * w) / 2, H / 2, (sz * w) / 2], s: [0.04, H, 0.04] });
    const seg = 0.6;
    const len = Math.hypot(w, seg);
    const ang = Math.atan2(w, seg);
    for (let i = 0; i < Math.floor(H / seg); i++) {
      const y = i * seg + seg / 2;
      const flip = i % 2 ? 1 : -1;
      b.push({ p: [0, y, w / 2], s: [0.02, len, 0.02], r: [0, 0, flip * ang] });
      b.push({ p: [0, y, -w / 2], s: [0.02, len, 0.02], r: [0, 0, -flip * ang] });
      b.push({ p: [w / 2, y, 0], s: [0.02, len, 0.02], r: [flip * ang, 0, 0] });
      b.push({ p: [-w / 2, y, 0], s: [0.02, len, 0.02], r: [-flip * ang, 0, 0] });
    }
    return b;
  }, []);
  const jibParts = useMemo(() => {
    const b: Box[] = [
      { p: [3.5, 0, 0.12], s: [6.6, 0.05, 0.05] },
      { p: [3.5, 0, -0.12], s: [6.6, 0.05, 0.05] },
      { p: [3.5, 0.3, 0], s: [6.6, 0.05, 0.05] },
      { p: [-1.4, 0.05, 0.14], s: [2.6, 0.06, 0.06] },
      { p: [-1.4, 0.05, -0.14], s: [2.6, 0.06, 0.06] },
      { p: [0, 0.75, 0], s: [0.07, 1.5, 0.07] },
    ];
    for (let i = 0; i < 11; i++) b.push({ p: [0.5 + i * 0.6, 0.15, 0], s: [0.02, 0.36, 0.02], r: [0, 0, i % 2 ? 0.7 : -0.7] });
    // tie bars from the apex to the jib and counter-jib
    const tie = (x: number) => {
      const dx = x;
      const dy = 0.3 - 1.5;
      return { p: [dx / 2, 1.5 + dy / 2, 0] as [number, number, number], s: [0.025, Math.hypot(dx, dy), 0.025] as [number, number, number], r: [0, 0, Math.atan2(-dx, dy)] as [number, number, number] };
    };
    b.push(tie(4.2), tie(-2.4));
    return b;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (jib.current) jib.current.rotation.y = reducedMotion ? 0.9 : 0.9 + Math.sin(t * 0.045) * 0.45;
    if (beacon.current) beacon.current.visible = reducedMotion || Math.sin(t * 2.4) > 0;
  });

  return (
    <group position={[-2.3, 0, -4.6]}>
      <mesh material={mats.weight} position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.9, 0.3, 0.9]} />
      </mesh>
      <InstancedBoxes items={lattice} material={mats.paint} castShadow />
      <group ref={jib} position={[0, H, 0]}>
        <mesh material={mats.paint} position={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.5, 0.3, 0.5]} />
        </mesh>
        <mesh material={mats.paint} position={[0.32, -0.05, 0.28]}>
          <boxGeometry args={[0.32, 0.3, 0.28]} />
        </mesh>
        <InstancedBoxes items={jibParts} material={mats.paint} castShadow />
        <mesh material={mats.weight} position={[-2.35, -0.15, 0]} castShadow>
          <boxGeometry args={[0.6, 0.5, 0.42]} />
        </mesh>
        <mesh material={mats.paint} position={[4.8, -1.6, 0]}>
          <boxGeometry args={[0.012, 3.2, 0.012]} />
        </mesh>
        <mesh material={mats.weight} position={[4.8, -3.25, 0]}>
          <boxGeometry args={[0.14, 0.16, 0.1]} />
        </mesh>
        <mesh ref={beacon} material={mats.red} position={[0, 1.55, 0]}>
          <boxGeometry args={[0.06, 0.06, 0.06]} />
        </mesh>
      </group>
    </group>
  );
}

function BackgroundCity({ m, level, quality, pointer, finePointer }: { m: ArchMaterials; level: MutableRefObject<number>; quality: SceneQuality; pointer: MutableRefObject<{ x: number; y: number }>; finePointer: boolean }) {
  const group = useRef<THREE.Group>(null);
  const data = useMemo(() => {
    const rand = seeded(97);
    const count = quality === "high" ? 22 : 11;
    const glass: Box[] = [];
    const concrete: Box[] = [];
    const windows: (Box & { threshold: number })[] = [];
    for (let i = 0; i < count; i++) {
      const x = -22 + (44 * i) / count + (rand() - 0.5) * 2;
      const z = -11 - rand() * 14;
      const w = 1.6 + rand() * 2.4;
      const d = 1.6 + rand() * 2;
      const h = 3 + rand() * 11;
      (rand() > 0.35 ? glass : concrete).push({ p: [x, h / 2, z], s: [w, h, d] });
      const lit = quality === "high" ? 18 : 6;
      for (let k = 0; k < lit; k++) {
        windows.push({
          p: [x + (rand() - 0.5) * w * 0.8, 0.6 + rand() * (h - 1), z + d / 2 + 0.01],
          s: [0.22, 0.16, 0.004],
          threshold: 0.15 + rand() * 0.85,
        });
      }
    }
    return { glass, concrete, windows };
  }, [quality]);

  useFrame((_, delta) => {
    if (!group.current || !finePointer) return;
    // Background layer drifts against the pointer for depth parallax.
    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, -pointer.current.x * 0.6, 2, delta);
  });

  return (
    <group ref={group}>
      <InstancedBoxes items={data.glass} material={m.glass} />
      <InstancedBoxes items={data.concrete} material={m.concreteDark} />
      <WindowLights items={data.windows} material={m.windowLight} levelRef={level} />
    </group>
  );
}

function Ground({ m }: { m: ArchMaterials }) {
  const mats = useMaterials(() => ({
    base: new THREE.MeshStandardMaterial({ color: "#0d1015", roughness: 1 }),
    plaza: new THREE.MeshStandardMaterial({ color: "#2a2d33", roughness: 0.8, metalness: 0.05 }),
    joint: new THREE.MeshStandardMaterial({ color: "#1b1e23", roughness: 1 }),
    road: new THREE.MeshStandardMaterial({ color: "#07090c", roughness: 0.6, metalness: 0.1 }),
    marking: new THREE.MeshStandardMaterial({ color: "#7e848d", roughness: 0.8 }),
  }));
  const parts = useMemo(() => {
    const joints: Box[] = [];
    for (let x = -8; x <= 8; x += 1.0) joints.push({ p: [x, 0.041, 0], s: [0.02, 0.002, 11] });
    for (let z = -5.5; z <= 5.5; z += 1.0) joints.push({ p: [0, 0.041, z], s: [16, 0.002, 0.02] });
    const dashes: Box[] = [];
    for (let x = -30; x <= 30; x += 1.6) dashes.push({ p: [x, 0.03, 7.0], s: [0.7, 0.004, 0.07] });
    const poles: Box[] = [];
    const heads: Box[] = [];
    for (let x = -7.5; x <= 7.5; x += 3) {
      poles.push({ p: [x, 0.6, 5.6], s: [0.045, 1.2, 0.045] });
      heads.push({ p: [x, 1.2, 5.6], s: [0.22, 0.035, 0.08] });
    }
    const planters: Box[] = [];
    const hedges: Box[] = [];
    for (const [x, z] of [
      [-6.5, 3.6],
      [-3.2, 4.4],
      [1.6, 4.6],
      [7.4, 0.2],
      [-7.6, -0.6],
      [6.8, -2.8],
    ] as const) {
      planters.push({ p: [x, 0.2, z], s: [1.3, 0.36, 0.55] });
      hedges.push({ p: [x, 0.47, z], s: [1.18, 0.22, 0.44] });
    }
    return { joints, dashes, poles, heads, planters, hedges };
  }, []);
  return (
    <group>
      <mesh material={mats.base} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[160, 160]} />
      </mesh>
      <mesh material={mats.plaza} position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[16, 0.04, 11]} />
      </mesh>
      <InstancedBoxes items={parts.joints} material={mats.joint} />
      <mesh material={mats.road} position={[0, 0.015, 7.0]} receiveShadow>
        <boxGeometry args={[80, 0.01, 2.8]} />
      </mesh>
      <InstancedBoxes items={parts.dashes} material={mats.marking} />
      <InstancedBoxes items={parts.poles} material={m.darkSteel} />
      <InstancedBoxes items={parts.heads} material={m.windowLight} />
      <InstancedBoxes items={parts.planters} material={m.stone} castShadow receiveShadow />
      <InstancedBoxes items={parts.hedges} material={m.foliage} castShadow />
    </group>
  );
}

// ── Atmosphere ─────────────────────────────────────────────────

/** Dusk sky dome: deep navy zenith fading to a muted warm horizon behind the fogged city. */
function SkyDome() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: { value: new THREE.Color("#05080d") },
          mid: { value: new THREE.Color("#101a2a") },
          horizon: { value: new THREE.Color("#4a3a3c") },
        },
        vertexShader: `varying vec3 vPos; void main(){ vPos = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 horizon; varying vec3 vPos;
          void main(){
            float h = vPos.y;
            vec3 c = mix(horizon, mid, smoothstep(-0.02, 0.18, h));
            c = mix(c, top, smoothstep(0.18, 0.75, h));
            gl_FragColor = vec4(c, 1.0);
          }`,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh material={material} renderOrder={-1}>
      <sphereGeometry args={[110, 32, 16]} />
    </mesh>
  );
}

// ── Camera & framing ───────────────────────────────────────────

function CameraRig({ progress, pointer, reducedMotion, finePointer, level }: Pick<HeroSceneProps, "progress" | "pointer" | "reducedMotion" | "finePointer"> & { level: MutableRefObject<number> }) {
  const { camera, size } = useThree();
  const desired = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(0, 4.6, 0), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const portrait = size.width < size.height;

  // Frame the architecture off-centre: right of the copy on desktop, above it on phones.
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const { width: w, height: h } = size;
    if (w >= 1024) cam.setViewOffset(w, h, -w * 0.2, 0, w, h);
    else if (w >= 768) cam.setViewOffset(w, h, -w * 0.08, h * 0.04, w, h);
    else cam.setViewOffset(w, h, 0, h * 0.31, w, h);
    cam.updateProjectionMatrix();
  }, [camera, size]);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    const p = reducedMotion ? 0 : clamp01(progress.current);
    const intro = reducedMotion ? 1 : easeOutCubic(clamp01(t / 3.2));
    const idle = reducedMotion ? 0 : Math.sin(t * 0.07) * 0.05;
    const ptr = finePointer && !reducedMotion ? pointer.current : { x: 0, y: 0 };

    const radius = (portrait ? 40 : 24.5) - p * 5 + (1 - intro) * 8;
    const theta = 0.62 + p * 0.95 + idle + ptr.x * 0.06 + (1 - intro) * 0.32;
    const height = 3.8 + p * 4.6 + ptr.y * 0.45 - (1 - intro) * 1.8;
    desired.set(Math.sin(theta) * radius, height, Math.cos(theta) * radius);
    if (reducedMotion) camera.position.copy(desired);
    else camera.position.lerp(desired, 1 - Math.exp(-3.2 * delta));

    lookTarget.set(0, 5.0 + p * 0.9, 0);
    look.lerp(lookTarget, reducedMotion ? 1 : 1 - Math.exp(-3 * delta));
    camera.lookAt(look);

    // Evening falls as you scroll: more windows light up.
    level.current = reducedMotion ? 0.45 : clamp01(0.04 + intro * 0.24 + p * 0.62);
  });
  return null;
}

function ReadySignal({ onReady }: { onReady?: () => void }) {
  const fired = useRef(false);
  useFrame(() => {
    if (fired.current) return;
    fired.current = true;
    requestAnimationFrame(() => onReady?.());
  });
  return null;
}

/**
 * The sun and the architecture are static, so the shadow map is rendered once
 * (plus a short settling window) instead of every frame — the largest single GPU saving.
 */
function StaticShadows() {
  const gl = useThree((s) => s.gl);
  const frames = useRef(0);
  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
  }, [gl]);
  useFrame(() => {
    if (frames.current++ < 3) gl.shadowMap.needsUpdate = true;
  });
  return null;
}

function SceneContents(props: HeroSceneProps) {
  const { quality, reducedMotion, pointer, finePointer } = props;
  const m = useMaterials(architectureMaterials);
  const level = useRef(0.1);
  const high = quality === "high";

  return (
    <>
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={["#141a24", 24, 70]} />
      <SkyDome />
      <hemisphereLight args={["#9db6ea", "#0b0d10", 0.42]} />
      <ambientLight intensity={0.12} />
      <directionalLight
        position={[-9, 13, 10]}
        color="#ffd2a6"
        intensity={2.3}
        castShadow={high}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-13}
        shadow-camera-right={13}
        shadow-camera-top={14}
        shadow-camera-bottom={-6}
        shadow-camera-near={1}
        shadow-camera-far={45}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[10, 7, -11]} color="#3360b5" intensity={1.6} />

      {/* Procedural reflection environment — warm sunset strip, royal-blue sky, soft top light */}
      <Environment resolution={high ? 256 : 64} frames={1}>
        <color attach="background" args={["#05070a"]} />
        <Lightformer form="rect" intensity={3.2} color="#ffb07a" position={[-12, 3, 9]} scale={[16, 2.4, 1]} target={[0, 3, 0]} />
        <Lightformer form="rect" intensity={1.8} color="#3360b5" position={[12, 9, -9]} scale={[14, 6, 1]} target={[0, 4, 0]} />
        <Lightformer form="rect" intensity={0.7} color="#cfd8e6" position={[0, 16, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[24, 24, 1]} />
        <Lightformer form="rect" intensity={0.5} color="#ffffff" position={[0, 2, 14]} scale={[30, 1.2, 1]} target={[0, 3, 0]} />
      </Environment>

      <HeroTower m={m} level={level} quality={quality} />
      <ResidentialBlock m={m} level={level} />
      <Pavilion m={m} level={level} />
      <Crane reducedMotion={reducedMotion} />
      <BackgroundCity m={m} level={level} quality={quality} pointer={pointer} finePointer={finePointer} />
      <Ground m={m} />
      {!high && <ContactShadows position={[0, 0.045, 0]} opacity={0.6} scale={22} blur={2.6} far={10} resolution={256} color="#000000" frames={1} />}

      {high && <StaticShadows />}
      <CameraRig progress={props.progress} pointer={pointer} reducedMotion={reducedMotion} finePointer={finePointer} level={level} />
      <ReadySignal onReady={props.onReady} />
    </>
  );
}

export default function HeroScene(props: HeroSceneProps) {
  const high = props.quality === "high";
  const maxDpr = high ? 1.75 : 1.25;
  const [dpr, setDpr] = useState(Math.min(maxDpr, typeof window === "undefined" ? 1 : window.devicePixelRatio));
  return (
    <Canvas
      shadows={high ? "percentage" : false}
      dpr={dpr}
      frameloop={props.reducedMotion ? "demand" : props.active ? "always" : "never"}
      camera={{ position: [14, 3, 16], fov: 34, near: 0.5, far: 140 }}
      gl={{ antialias: high, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.08 }}
      aria-hidden="true"
    >
      {/* Lowers the render resolution if the device can't hold a smooth frame rate. */}
      <PerformanceMonitor onDecline={() => setDpr((d) => Math.max(1, d - 0.25))} flipflops={3} onFallback={() => setDpr(1)} />
      <SceneContents {...props} />
    </Canvas>
  );
}
