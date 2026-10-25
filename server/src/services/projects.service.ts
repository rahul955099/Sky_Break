import { prisma, type Prisma } from "../db.js";
import type { ProjectInput } from "../schemas/index.js";
import { conflict, notFound } from "../utils/http.js";
import { slugify } from "../utils/security.js";

const listSelect = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  category: true,
  status: true,
  location: true,
  coverImageUrl: true,
  coverImageAlt: true,
  isSample: true,
  isPublished: true,
  isFeatured: true,
  sortOrder: true,
  updatedAt: true,
} satisfies Prisma.ProjectSelect;

const detailInclude = {
  images: { orderBy: { sortOrder: "asc" }, select: { id: true, url: true, alt: true, sortOrder: true } },
  services: { select: { id: true, slug: true, title: true, icon: true }, orderBy: { sortOrder: "asc" } },
} satisfies Prisma.ProjectInclude;

export interface ProjectFilters {
  category?: "RESIDENTIAL" | "COMMERCIAL" | "DEVELOPMENT";
  search?: string;
  featured?: "true" | "false";
  service?: string;
  published?: "true" | "false";
  page: number;
  pageSize: number;
}

export async function listProjects(filters: ProjectFilters, { publicOnly }: { publicOnly: boolean }) {
  const where: Prisma.ProjectWhereInput = {
    ...(publicOnly ? { isPublished: true } : filters.published ? { isPublished: filters.published === "true" } : {}),
    ...(filters.category && { category: filters.category }),
    ...(filters.featured && { isFeatured: filters.featured === "true" }),
    ...(filters.service && { services: { some: { slug: filters.service } } }),
    ...(filters.search && {
      OR: [
        { title: { contains: filters.search, mode: "insensitive" } },
        { summary: { contains: filters.search, mode: "insensitive" } },
        { location: { contains: filters.search, mode: "insensitive" } },
      ],
    }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.project.findMany({
      where,
      select: listSelect,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.project.count({ where }),
  ]);
  return { items, total };
}

export async function getPublishedProject(slug: string) {
  const project = await prisma.project.findFirst({ where: { slug, isPublished: true }, include: detailInclude });
  if (!project) throw notFound("Project");
  const related = await prisma.project.findMany({
    where: { isPublished: true, category: project.category, NOT: { id: project.id } },
    select: listSelect,
    orderBy: [{ sortOrder: "asc" }],
    take: 3,
  });
  return { ...project, related };
}

export async function getProjectById(id: string) {
  const project = await prisma.project.findUnique({ where: { id }, include: detailInclude });
  if (!project) throw notFound("Project");
  return project;
}

async function uniqueSlug(base: string, excludeId?: string) {
  const root = slugify(base) || "project";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const existing = await prisma.project.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === excludeId) return candidate;
  }
  throw conflict("Could not generate a unique slug");
}

function toData(input: ProjectInput) {
  const { images: _i, serviceIds: _s, slug: _slug, ...rest } = input;
  return rest;
}

export async function createProject(input: ProjectInput) {
  if (input.slug && (await prisma.project.findUnique({ where: { slug: input.slug } }))) {
    throw conflict("A project with this slug already exists");
  }
  const slug = input.slug ?? (await uniqueSlug(input.title));
  return prisma.project.create({
    data: {
      ...toData(input),
      slug,
      images: { create: input.images.map((img, i) => ({ ...img, sortOrder: i })) },
      services: { connect: input.serviceIds.map((id) => ({ id })) },
    },
    include: detailInclude,
  });
}

export async function updateProject(id: string, input: ProjectInput) {
  const existing = await prisma.project.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw notFound("Project");
  if (input.slug) {
    const clash = await prisma.project.findUnique({ where: { slug: input.slug }, select: { id: true } });
    if (clash && clash.id !== id) throw conflict("A project with this slug already exists");
  }
  const slug = input.slug ?? (await uniqueSlug(input.title, id));
  // Gallery is replaced wholesale so ordering edits from the dashboard are exact.
  return prisma.$transaction(async (tx) => {
    await tx.projectImage.deleteMany({ where: { projectId: id } });
    return tx.project.update({
      where: { id },
      data: {
        ...toData(input),
        slug,
        images: { create: input.images.map((img, i) => ({ ...img, sortOrder: i })) },
        services: { set: input.serviceIds.map((sid) => ({ id: sid })) },
      },
      include: detailInclude,
    });
  });
}

export async function setProjectPublished(id: string, isPublished: boolean) {
  return prisma.project.update({ where: { id }, data: { isPublished }, select: listSelect });
}

export async function deleteProject(id: string) {
  // Images cascade; enquiries keep their record with projectId set to null.
  await prisma.project.delete({ where: { id } });
}
