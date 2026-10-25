/**
 * Official Skybreak Infra Pvt Ltd brand assets.
 *
 * Files live in client/public/brand/ and are served from the site root in both the
 * Vite dev server and production builds. `skybreak-infra-logo.png` is the original,
 * unmodified logo; the other files are crop-only (or downscaled) variants of it.
 */
export const brand = {
  name: "Skybreak Infra Pvt Ltd",
  tagline: "ELEVATING EXCELLENCE",
  logoAlt: "Skybreak Infra Pvt Ltd logo",
  /** Original supplied artwork (symbol, name and tagline on white). */
  logo: "/brand/skybreak-infra-logo.png",
  /** Full lockup with surrounding white space trimmed — 794 × 572. */
  logoCropped: "/brand/skybreak-infra-logo-cropped.png",
  /** Eye-and-house symbol only, for compact placements — 687 × 335. */
  mark: "/brand/skybreak-infra-mark.png",
  /** Blue sampled from the logo artwork. */
  blue: "#3360B5",
} as const;
