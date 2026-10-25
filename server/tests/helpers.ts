import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma, type AdminRole } from "../src/db.js";
import { hashPassword } from "../src/services/auth.service.js";

export const app = createApp();
export const PASSWORD = "Correct-Horse-42";

export async function resetDb() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "EnquiryNote", "Enquiry", "ProjectImage", "_ProjectServices", "Project", "Service", "Session", "AdminUser", "CompanySetting" RESTART IDENTITY CASCADE',
  );
}

export async function createAdmin(role: AdminRole = "OWNER", email = `${role.toLowerCase()}@test.local`) {
  return prisma.adminUser.create({
    data: { email, name: `${role} User`, role, passwordHash: await hashPassword(PASSWORD) },
  });
}

/** Logs in and returns a cookie-persisting agent plus the CSRF token. */
export async function login(email: string) {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/login").send({ email, password: PASSWORD }).expect(200);
  return { agent, csrf: res.body.data.csrfToken as string };
}

export const validEnquiry = () => ({
  fullName: "Test Person",
  email: "Person@Example.com",
  phone: "+1 555 0100",
  projectType: "Residential construction",
  projectLocation: "Sample City",
  budgetRange: "",
  message: "We would like to discuss building a new family home.",
  consent: true,
  website: "",
  formStartedAt: Date.now() - 10_000,
});

export async function seedProject(overrides: Partial<Parameters<typeof prisma.project.create>[0]["data"]> = {}) {
  return prisma.project.create({
    data: {
      slug: `project-${Math.random().toString(36).slice(2, 8)}`,
      title: "Sample Tower",
      summary: "A sample project summary for tests.",
      description: "A sample project description used in automated tests.",
      category: "COMMERCIAL",
      status: "CONCEPT",
      coverImageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab",
      coverImageAlt: "Glass towers",
      isPublished: true,
      isSample: true,
      ...overrides,
    },
  });
}
