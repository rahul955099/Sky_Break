import bcrypt from "bcryptjs";
import { prisma, type AdminRole } from "../db.js";
import { env } from "../config/env.js";
import { randomToken, sha256 } from "../utils/security.js";

export const SESSION_COOKIE = "sb_session";
const BCRYPT_ROUNDS = 12;

// A real hash compared against when the email is unknown, so response time does not reveal valid accounts.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password-placeholder", BCRYPT_ROUNDS);

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

export const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_ROUNDS);

export async function verifyCredentials(email: string, password: string): Promise<SessionUser | null> {
  const user = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid || !user.isActive) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function createSession(userId: string, userAgent?: string) {
  const token = randomToken(32);
  const csrfToken = randomToken(24);
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_HOURS * 3600_000);
  await prisma.$transaction([
    prisma.session.create({
      data: { tokenHash: sha256(token), csrfToken, userId, expiresAt, userAgent: userAgent?.slice(0, 255) },
    }),
    prisma.adminUser.update({ where: { id: userId }, data: { lastLoginAt: new Date() } }),
    // Opportunistic cleanup of expired sessions.
    prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
  ]);
  return { token, csrfToken, expiresAt };
}

export async function findSession(token: string) {
  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: { select: { id: true, email: true, name: true, role: true, isActive: true } } },
  });
  if (!session || session.expiresAt < new Date() || !session.user.isActive) return null;
  return session;
}

export async function destroySession(token: string) {
  await prisma.session.deleteMany({ where: { tokenHash: sha256(token) } });
}
