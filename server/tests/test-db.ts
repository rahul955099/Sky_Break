import path from "node:path";
import { config as loadEnv } from "dotenv";

/** Derives the test database URL so tests never touch the development database. */
export function testDatabaseUrl() {
  loadEnv({ path: path.resolve(import.meta.dirname, "../../.env"), quiet: true });
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  const base = process.env.DATABASE_URL;
  if (!base) throw new Error("Set DATABASE_URL or TEST_DATABASE_URL to run API tests");
  const url = new URL(base);
  url.pathname = `${url.pathname.replace(/\/$/, "")}_test`;
  return url.toString();
}
