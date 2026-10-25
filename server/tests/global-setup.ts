import { execSync } from "node:child_process";
import { testDatabaseUrl } from "./test-db.js";

export default function setup() {
  const url = testDatabaseUrl();
  execSync("npx prisma migrate deploy", {
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: url },
    cwd: new URL("..", import.meta.url),
  });
}
