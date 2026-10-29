/**
 * Pre-flight check for `npm run dev` (also `npm run db:check`).
 *
 * Makes sure the development database is reachable and migrated before the API starts, so a
 * stopped database shows up as one clear instruction instead of HTTP 500/503 errors in the site.
 *
 *  1. Loads DATABASE_URL from the root .env.
 *  2. Connects to PostgreSQL. If it is local and Docker is running but the container is stopped,
 *     runs the documented `docker compose up -d db` and waits for it to accept connections.
 *  3. Compares applied Prisma migrations with server/prisma/migrations and stops if any are
 *     pending (it never applies or resets anything itself).
 *
 * Set SKIP_DB_CHECK=1 to bypass (for example when working on the front end only).
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requireFromServer = createRequire(path.join(root, "server", "package.json"));
const { config: loadEnv } = requireFromServer("dotenv");
const pg = requireFromServer("pg");

const ok = (msg) => console.log(`\x1b[32m✔\x1b[0m ${msg}`);
const info = (msg) => console.log(`  ${msg}`);
const fail = (msg, steps = []) => {
  console.error(`\n\x1b[31m✖ ${msg}\x1b[0m`);
  for (const s of steps) console.error(`  → ${s}`);
  console.error("  (Set SKIP_DB_CHECK=1 to start anyway.)\n");
  process.exit(1);
};

if (process.env.SKIP_DB_CHECK === "1" || process.env.SKIP_DB_CHECK === "true") {
  info("Database pre-flight check skipped (SKIP_DB_CHECK).");
  process.exit(0);
}

const envPath = path.join(root, ".env");
if (!fs.existsSync(envPath)) {
  fail("No .env file found.", ["Copy the template: Copy-Item .env.example .env", "Then set SESSION_SECRET (see README → Quick start)."]);
}
loadEnv({ path: envPath, quiet: true });

let url;
try {
  url = new URL(process.env.DATABASE_URL ?? "");
} catch {
  fail("DATABASE_URL in .env is missing or not a valid URL.", ["See .env.example for the expected format."]);
}
const where = `${url.hostname}:${url.port || 5432}${url.pathname}`; // host/port/database only — never credentials
const isLocal = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname);

async function tryConnect() {
  const client = new pg.Client({ connectionString: url.toString(), connectionTimeoutMillis: 3000 });
  try {
    await client.connect();
    await client.query("SELECT 1");
    return { client };
  } catch (err) {
    await client.end().catch(() => {});
    return { error: err };
  }
}

function dockerRunning() {
  try {
    execFileSync("docker", ["info", "--format", "{{.ServerVersion}}"], { stdio: "ignore", timeout: 10_000 });
    return true;
  } catch {
    return false;
  }
}

let { client, error } = await tryConnect();

if (!client && error?.code === "ECONNREFUSED" && isLocal) {
  if (!dockerRunning()) {
    fail(`PostgreSQL is not reachable at ${where}, and Docker Desktop is not running.`, [
      "Start Docker Desktop and wait until it says it is running.",
      "Then run: npm run db:up   (or simply run npm run dev again — it starts the database for you).",
    ]);
  }
  info(`Database not running at ${where} — starting the development container (docker compose up -d db)…`);
  try {
    execFileSync("docker", ["compose", "up", "-d", "db"], { cwd: root, stdio: "inherit", timeout: 180_000 });
  } catch {
    fail("Could not start the database container.", ["Run `npm run db:up` to see the full Docker error."]);
  }
  for (let i = 0; i < 30 && !client; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    ({ client, error } = await tryConnect());
  }
}

if (!client) {
  const code = error?.code ?? "UNKNOWN";
  const hints = {
    ECONNREFUSED: ["Make sure PostgreSQL is running and DATABASE_URL points to it.", "Local Docker database: npm run db:up"],
    "28P01": ["The username or password in DATABASE_URL is wrong."],
    "3D000": ["The database in DATABASE_URL does not exist yet. Create it, then run: npm run db:deploy"],
    ENOTFOUND: ["The host name in DATABASE_URL cannot be resolved."],
  };
  fail(`Cannot connect to PostgreSQL at ${where} (${code}).`, hints[code] ?? ["Check DATABASE_URL and that the database server is running."]);
}

// ── Migrations ───────────────────────────────────────────────
const migrationsDir = path.join(root, "server", "prisma", "migrations");
const expected = fs
  .readdirSync(migrationsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

let applied = [];
try {
  const res = await client.query(
    'SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL',
  );
  applied = res.rows.map((r) => r.migration_name);
} catch (err) {
  await client.end();
  if (err.code === "42P01") {
    fail(`Connected to ${where}, but the database has no tables yet.`, [
      "Create the tables: npm run db:deploy",
      "Load the starter services: npm run db:seed",
      "Create your admin login: npm run admin:create",
    ]);
  }
  throw err;
}
await client.end();

const pending = expected.filter((m) => !applied.includes(m));
if (pending.length) {
  fail(`Connected to ${where}, but ${pending.length} database migration(s) have not been applied:`, [
    ...pending.map((m) => `pending: ${m}`),
    "Apply them (safe — never deletes data): npm run db:deploy",
  ]);
}

ok(`Database ready at ${where} — ${applied.length} migration(s) applied, none pending.`);
