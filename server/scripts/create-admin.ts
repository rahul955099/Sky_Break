/**
 * Creates (or with --reset, re-keys) an administrator account.
 *
 *   npm run admin:create                 # interactive password prompt
 *   npm run admin:create -- --reset      # reset password for ADMIN_EMAIL
 *   npm run admin:create -- --role OWNER # OWNER | ADMIN | EDITOR (default OWNER)
 *
 * Email and name come from ADMIN_EMAIL / ADMIN_NAME (or --email / --name).
 * The password is read from a hidden prompt, or ADMIN_PASSWORD for CI only.
 */
import readline from "node:readline";
import { Writable } from "node:stream";
import { z } from "zod";
import { prisma, type AdminRole } from "../src/db.js";
import { hashPassword } from "../src/services/auth.service.js";

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

function promptHidden(question: string): Promise<string> {
  let muted = false;
  const output = new Writable({
    write(chunk, _enc, cb) {
      if (!muted) process.stdout.write(chunk);
      cb();
    },
  });
  const rl = readline.createInterface({ input: process.stdin, output, terminal: true });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    muted = true;
  });
}

const passwordRule = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/\d/, "Include a number");

async function main() {
  const email = z.email().parse((arg("email") ?? process.env.ADMIN_EMAIL ?? "").trim().toLowerCase());
  const name = (arg("name") ?? process.env.ADMIN_NAME ?? "Administrator").trim();
  const role = z.enum(["OWNER", "ADMIN", "EDITOR"]).parse(arg("role") ?? "OWNER") as AdminRole;
  const reset = process.argv.includes("--reset");

  if (email === "admin@example.com") {
    console.warn("⚠  ADMIN_EMAIL is still the placeholder admin@example.com — set a real address in .env.");
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing && !reset) {
    console.error(`An admin with ${email} already exists. Use --reset to set a new password.`);
    process.exitCode = 1;
    return;
  }

  let password = process.env.ADMIN_PASSWORD;
  if (!password) {
    password = await promptHidden(`Password for ${email}: `);
    const confirm = await promptHidden("Confirm password: ");
    if (password !== confirm) throw new Error("Passwords do not match");
  }
  const parsed = passwordRule.safeParse(password);
  if (!parsed.success) throw new Error(parsed.error.issues.map((i) => i.message).join("; "));

  const passwordHash = await hashPassword(parsed.data);
  if (existing) {
    await prisma.$transaction([
      prisma.adminUser.update({ where: { id: existing.id }, data: { passwordHash, isActive: true } }),
      prisma.session.deleteMany({ where: { userId: existing.id } }),
    ]);
    console.log(`✔ Password reset for ${email}. Existing sessions were signed out.`);
  } else {
    await prisma.adminUser.create({ data: { email, name, role, passwordHash } });
    console.log(`✔ Created ${role} account for ${email}. Sign in at /admin/login.`);
  }
}

main()
  .catch((err) => {
    console.error(`✖ ${(err as Error).message}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
