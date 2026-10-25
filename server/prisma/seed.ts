/**
 * Demo seed — idempotent. Existing records (matched by slug) are left untouched so
 * edits made in the admin dashboard are never overwritten. Admin users are NOT
 * created here; use `npm run admin:create`.
 */
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { projects, services } from "./seed-data.js";
import { BRAND_DEFAULTS } from "../src/config/brand.js";

loadEnv({ path: path.resolve(import.meta.dirname, "../../.env"), quiet: true });

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

async function main() {
  await prisma.companySetting.upsert({ where: { id: "default" }, update: {}, create: { id: "default", ...BRAND_DEFAULTS } });

  let createdServices = 0;
  for (const [index, s] of services.entries()) {
    const exists = await prisma.service.findUnique({ where: { slug: s.slug }, select: { id: true } });
    if (exists) continue;
    await prisma.service.create({ data: { ...s, sortOrder: index, isPublished: true } });
    createdServices++;
  }

  let createdProjects = 0;
  for (const [index, p] of projects.entries()) {
    const exists = await prisma.project.findUnique({ where: { slug: p.slug }, select: { id: true } });
    if (exists) continue;
    const { images, services: serviceSlugs, ...rest } = p;
    await prisma.project.create({
      data: {
        ...rest,
        isSample: true,
        isPublished: true,
        sortOrder: index,
        images: { create: images.map((im, i) => ({ ...im, sortOrder: i })) },
        services: { connect: serviceSlugs.map((slug) => ({ slug })) },
      },
    });
    createdProjects++;
  }

  console.log(`Seed complete: ${createdServices} services and ${createdProjects} sample projects created.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
