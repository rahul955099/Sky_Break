/** Service → miniature model mapping. Kept free of three.js imports so UI code can use it without loading WebGL code. */
export type ServiceModelKind =
  | "house"
  | "villa"
  | "apartments"
  | "tower"
  | "retail"
  | "district"
  | "structure"
  | "renovation"
  | "masterplan";

const SLUG_TO_KIND: Record<string, ServiceModelKind> = {
  "residential-construction": "house",
  "luxury-villas-independent-houses": "villa",
  "apartments-residential-complexes": "apartments",
  "commercial-construction": "tower",
  "office-buildings-retail-spaces": "retail",
  "real-estate-development": "district",
  "civil-structural-construction": "structure",
  "renovation-remodeling": "renovation",
  "complete-construction-solutions": "masterplan",
};

const ICON_TO_KIND: Record<string, ServiceModelKind> = {
  home: "house",
  gem: "villa",
  "building-2": "apartments",
  building: "tower",
  briefcase: "retail",
  landmark: "district",
  "hard-hat": "structure",
  hammer: "renovation",
  layers: "masterplan",
};

export function serviceModelKind(slug: string, icon?: string): ServiceModelKind {
  return SLUG_TO_KIND[slug] ?? (icon ? ICON_TO_KIND[icon] : undefined) ?? "tower";
}

export const ALL_KINDS: ServiceModelKind[] = ["house", "villa", "apartments", "tower", "retail", "district", "structure", "renovation", "masterplan"];
