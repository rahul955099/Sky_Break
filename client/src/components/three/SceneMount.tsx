import { Component, Suspense, useRef, type ReactNode } from "react";
import { useInView } from "motion/react";
import { useDeviceProfile } from "../../hooks/useDeviceProfile";

class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn("[3D] Scene failed, showing static fallback:", (error as Error)?.message);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

interface Props {
  className?: string;
  /** Rendered when WebGL is unavailable or the scene throws. */
  fallback: ReactNode;
  /** Shown while the scene's code chunk downloads. */
  loader?: ReactNode;
  /** How far outside the viewport the scene is created (and destroyed again). */
  margin?: `${number}px ${number}px` | `${number}px`;
  /** Receives `active` — true only while the container is on screen, so render loops can pause. */
  children: (active: boolean) => ReactNode;
}

/**
 * Lifecycle wrapper for WebGL scenes:
 * - mounts the scene only when it approaches the viewport (lazy chunk + GPU context),
 * - unmounts it again when it is far away, so React Three Fiber disposes the renderer,
 * - reports on-screen visibility so the render loop can stop when off-screen,
 * - falls back to static content without WebGL or after a runtime error.
 */
export function SceneMount({ className, fallback, loader = null, margin = "400px 0px", children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const near = useInView(ref, { margin });
  const visible = useInView(ref, { margin: "0px" });
  const { webgl } = useDeviceProfile();

  return (
    <div ref={ref} className={className}>
      {!webgl ? (
        fallback
      ) : (
        <SceneBoundary fallback={fallback}>
          <Suspense fallback={loader}>{near ? children(visible) : loader}</Suspense>
        </SceneBoundary>
      )}
    </div>
  );
}
