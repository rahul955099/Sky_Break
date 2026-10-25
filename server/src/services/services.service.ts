import { prisma } from "../db.js";
import type { ServiceInput } from "../schemas/index.js";
import { conflict, notFound } from "../utils/http.js";
import { slugify } from "../utils/security.js";

const relatedProjectSelect = {
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
} as const;

export function listServices({ publicOnly }: { publicOnly: boolean }) {
  return prisma.service.findMany({
    where: publicOnly ? { isPublished: true } : undefined,
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      shortDescription: true,
      heroImageUrl: true,
      heroImageAlt: true,
      icon: true,
      isPublished: true,
      sortOrder: true,
      updatedAt: true,
    },
  });
}

export async function getPublishedService(slug: string) {
  const service = await prisma.service.findFirst({
    where: { slug, isPublished: true },
    include: {
      projects: { where: { isPublished: true }, select: relatedProjectSelect, orderBy: { sortOrder: "asc" }, take: 6 },
    },
  });
  if (!service) throw notFound("Service");
  return service;
}

export async function getServiceById(id: string) {
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) throw notFound("Service");
  return service;
}

async function resolveSlug(input: ServiceInput, excludeId?: string) {
  const slug = input.slug ?? slugify(input.title);
  const clash = await prisma.service.findUnique({ where: { slug }, select: { id: true } });
  if (clash && clash.id !== excludeId) throw conflict("A service with this slug already exists");
  return slug;
}

export async function createService(input: ServiceInput) {
  const slug = await resolveSlug(input);
  return prisma.service.create({ data: { ...input, slug } });
}

export async function updateService(id: string, input: ServiceInput) {
  await getServiceById(id);
  const slug = await resolveSlug(input, id);
  return prisma.service.update({ where: { id }, data: { ...input, slug } });
}

export async function reorderServices(ids: string[]) {
  await prisma.$transaction(ids.map((id, index) => prisma.service.update({ where: { id }, data: { sortOrder: index } })));
}

export async function deleteService(id: string) {
  await prisma.service.delete({ where: { id } });
}
