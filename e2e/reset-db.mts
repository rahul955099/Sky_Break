/** Wipes the e2e database. Refuses to run against anything that is not a *_test database. */
import { prisma } from "../server/src/db.ts";

const name = new URL(process.env.DATABASE_URL ?? "").pathname;
if (!name.endsWith("_test")) {
  console.error(`Refusing to reset non-test database "${name}"`);
  process.exit(1);
}
await prisma.$executeRawUnsafe(
  'TRUNCATE "EnquiryNote", "Enquiry", "ProjectImage", "_ProjectServices", "Project", "Service", "Session", "AdminUser", "CompanySetting" CASCADE',
);
await prisma.$disconnect();
