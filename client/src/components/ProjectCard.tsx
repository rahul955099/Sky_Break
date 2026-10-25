import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowUpRight, MapPin } from "lucide-react";
import { categoryLabel, statusLabel } from "../lib/format";
import type { ProjectSummary } from "../types/api";
import { Img } from "./ui/Img";
import { Badge, SampleBadge } from "./ui/misc";

export function ProjectCard({ project, priority, tall }: { project: ProjectSummary; priority?: boolean; tall?: boolean }) {
  return (
    <motion.article layout="position" className="group relative">
      <Link to={`/projects/${project.slug}`} className="block rounded-[24px] focus-visible:outline-offset-4">
        <div className="relative overflow-hidden rounded-[24px]">
          <Img
            src={project.coverImageUrl}
            alt={project.coverImageAlt}
            width={1000}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            priority={priority}
            frameClassName={tall ? "aspect-[4/5]" : "aspect-[4/3]"}
            className="group-hover:scale-[1.06]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-transparent to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-90" />
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <Badge tone="dark">{categoryLabel[project.category]}</Badge>
            {project.isSample && <SampleBadge className="bg-white/90" />}
          </div>
          <span className="absolute right-4 bottom-4 grid h-11 w-11 translate-y-2 place-items-center rounded-full bg-white text-navy opacity-0 shadow-lg transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>
        <div className="mt-5 px-1">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8rem] text-muted">
            <span className="font-semibold tracking-wide text-blue uppercase">{statusLabel[project.status]}</span>
            {project.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {project.location}
              </span>
            )}
          </div>
          <h3 className="mt-2 font-display text-xl font-bold transition-colors group-hover:text-blue sm:text-[1.4rem]">{project.title}</h3>
          <p className="mt-2 line-clamp-2 leading-relaxed text-muted">{project.summary}</p>
        </div>
      </Link>
    </motion.article>
  );
}
