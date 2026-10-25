import { execSync } from "node:child_process";
import path from "node:path";
import { E2E_ADMIN, e2eDatabaseUrl } from "./env";

/** Migrates, wipes and re-seeds the e2e database, then creates a known admin account. */
export default function globalSetup() {
  const server = path.resolve(__dirname, "../server");
  const databaseUrl = e2eDatabaseUrl(); // also loads the root .env into process.env
  const env = { ...process.env, DATABASE_URL: databaseUrl };
  const run = (cmd: string, extra: Record<string, string> = {}) =>
    execSync(cmd, { cwd: server, stdio: "pipe", env: { ...env, ...extra } });

  run("npx prisma migrate deploy");
  run("npx tsx ../e2e/reset-db.mts");
  run("npx tsx prisma/seed.ts");
  run("npx tsx scripts/create-admin.ts", { ADMIN_EMAIL: E2E_ADMIN.email, ADMIN_NAME: "E2E Owner", ADMIN_PASSWORD: E2E_ADMIN.password });
}
