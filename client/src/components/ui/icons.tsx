import {
  Briefcase,
  Building,
  Building2,
  CalendarClock,
  ClipboardCheck,
  Compass,
  Eye,
  Gem,
  HardHat,
  Hammer,
  HeartHandshake,
  House,
  Landmark,
  Layers,
  Leaf,
  Lightbulb,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  home: House,
  gem: Gem,
  "building-2": Building2,
  building: Building,
  briefcase: Briefcase,
  landmark: Landmark,
  "hard-hat": HardHat,
  hardhat: HardHat,
  hammer: Hammer,
  layers: Layers,
  shield: ShieldCheck,
  eye: Eye,
  lightbulb: Lightbulb,
  heart: HeartHandshake,
  leaf: Leaf,
  trend: TrendingUp,
  clipboard: ClipboardCheck,
  users: Users,
  compass: Compass,
  message: MessageSquare,
  calendar: CalendarClock,
};

export const iconKeys = Object.keys(map);

export function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = map[name] ?? Building;
  return <Cmp className={className} aria-hidden="true" strokeWidth={1.6} />;
}
