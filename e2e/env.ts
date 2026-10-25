import path from "node:path";
import { config as loadEnv } from "dotenv";

export const E2E_ADMIN = { email: "e2e-owner@example.test", password: "E2e-Owner-Passw0rd!" };

/** Same derivation as the API tests: <DATABASE_URL>_test, never the development database. */
export function e2eDatabaseUrl() {
  loadEnv({ path: path.resolve(__dirname, "../.env"), quiet: true });
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  const base = process.env.DATABASE_URL;
  if (!base) throw new Error("Set DATABASE_URL or TEST_DATABASE_URL to run e2e tests");
  const url = new URL(base);
  url.pathname = `${url.pathname.replace(/\/$/, "")}_test`;
  return url.toString();
}
