/** Unsplash photography (Unsplash License). Sources are listed in docs/IMAGE_CREDITS.md. */
export const img = (id: string, w = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const images = {
  hero: img("1487958449943-2429e8be8625", 2000),
  heroAlt: "Angular white contemporary building with glass facade against a bright sky",
  intro: img("1600596542815-ffad4c1539a9"),
  introAlt: "Multi-level white villa with terraces beside a swimming pool",
  introSecondary: img("1503387762-592deb58ef4e", 900),
  introSecondaryAlt: "Architectural plans being reviewed on a desk",
  threeFallback: img("1479839672679-a46483c0e7c8", 1400),
  threeFallbackAlt: "White modular building facade with deep window reveals",
  about: img("1515263487990-61b07816b324"),
  aboutAlt: "Modern residential building with crisp white and black facade",
  quality: img("1504307651254-35680f356dfd"),
  qualityAlt: "Construction team in safety gear working on steel reinforcement",
  sustainability: img("1600566753190-17f0baa2a6c3"),
  sustainabilityAlt: "Contemporary timber-clad home with planted front garden",
  cta: img("1431576901776-e539bd916ba2", 2000),
  ctaAlt: "Reflective glass towers seen from below",
  contact: img("1497366811353-6870744d04b2"),
  contactAlt: "Bright office with glass meeting room",
  process: img("1429497419816-9ca5cfb4571a", 2000),
  processAlt: "Tower cranes above a building under construction",
};
