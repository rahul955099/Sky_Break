import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import type { ServiceSummary } from "../types/api";
import { Icon } from "./ui/icons";
import { Img } from "./ui/Img";
import { staggerItem } from "./ui/Reveal";

export function ServiceCard({ service, index }: { service: ServiceSummary; index: number }) {
  return (
    <motion.li variants={staggerItem} className="h-full">
      <Link
        to={`/services/${service.slug}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-[24px] border border-line bg-white p-6 transition-all duration-500 ease-[var(--ease-premium)] hover:-translate-y-1 hover:border-transparent hover:shadow-lift sm:p-7"
      >
        {/* image wash revealed on hover */}
        <div className="absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100" aria-hidden="true">
          <Img src={service.heroImageUrl} alt="" width={800} frameClassName="h-full w-full" className="scale-110 transition-transform duration-[1.4s] group-hover:scale-100" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/85 to-navy/50" />
        </div>
        <div className="relative flex items-start justify-between">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue transition-colors duration-500 group-hover:bg-white/15 group-hover:text-white">
            <Icon name={service.icon} className="h-6 w-6" />
          </span>
          <span className="font-display text-sm font-semibold text-muted tabular-nums transition-colors group-hover:text-white/60">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        <h3 className="relative mt-10 font-display text-xl font-bold transition-colors duration-500 group-hover:text-white">{service.title}</h3>
        <p className="relative mt-3 flex-1 leading-relaxed text-muted transition-colors duration-500 group-hover:text-white/75">
          {service.shortDescription}
        </p>
        <span className="relative mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue transition-colors group-hover:text-white">
          Explore service
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </Link>
    </motion.li>
  );
}
