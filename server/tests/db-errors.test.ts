import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { Prisma } from "../src/db.js";
import { errorHandler } from "../src/middleware/error.js";
import { databaseUnavailableCode } from "../src/utils/dbErrors.js";

const known = (code: string) => new Prisma.PrismaClientKnownRequestError("db failure", { code, clientVersion: "test" });

/** Minimal app that throws the given error through the real error handler. */
function appThatThrows(err: unknown) {
  const app = express();
  app.get("/boom", () => {
    throw err;
  });
  app.use(errorHandler);
  return app;
}

describe("database availability errors", () => {
  it("classifies connection failures, not ordinary query errors", () => {
    expect(databaseUnavailableCode(known("ECONNREFUSED"))).toBe("ECONNREFUSED");
    expect(databaseUnavailableCode(known("P1001"))).toBe("P1001");
    expect(databaseUnavailableCode(new Prisma.PrismaClientInitializationError("init", "test", "P1000"))).toBe("P1000");
    expect(databaseUnavailableCode(known("P2002"))).toBeNull();
    expect(databaseUnavailableCode(new Error("bug"))).toBeNull();
  });

  it("returns 503 DATABASE_UNAVAILABLE with Retry-After when PostgreSQL is unreachable", async () => {
    const res = await request(appThatThrows(known("ECONNREFUSED"))).get("/boom").expect(503);
    expect(res.headers["retry-after"]).toBe("30");
    expect(res.body.error.code).toBe("DATABASE_UNAVAILABLE");
    expect(JSON.stringify(res.body)).not.toMatch(/postgres|ECONNREFUSED|stack/i); // no internals leaked
  });

  it("keeps the specific responses for real query errors and a 500 for genuine bugs", async () => {
    await request(appThatThrows(known("P2002"))).get("/boom").expect(409);
    await request(appThatThrows(known("P2025"))).get("/boom").expect(404);
    const bug = await request(appThatThrows(new Error("unexpected"))).get("/boom").expect(500);
    expect(bug.body.error.code).toBe("INTERNAL_ERROR");
  });
});

describe("dev pre-flight check (scripts/dev-preflight.mjs)", () => {
  const run = promisify(execFile);
  const script = path.resolve(import.meta.dirname, "../../scripts/dev-preflight.mjs");
  const exec = (databaseUrl: string) =>
    run(process.execPath, [script], { env: { ...process.env, DATABASE_URL: databaseUrl, SKIP_DB_CHECK: "" }, timeout: 30_000 }).then(
      (r) => ({ code: 0, out: r.stdout + r.stderr }),
      (e: { code: number; stdout: string; stderr: string }) => ({ code: e.code, out: e.stdout + e.stderr }),
    );

  it("passes against a migrated database", async () => {
    // setup-env already points DATABASE_URL at the test database, which global setup migrates.
    const { code, out } = await exec(process.env.DATABASE_URL!);
    expect(code, out).toBe(0);
    expect(out).toMatch(/none pending/);
  });

  it("fails with a clear message when PostgreSQL is unreachable", async () => {
    // A non-local address that refuses connections, so the script never tries to start Docker.
    const { code, out } = await exec("postgresql://user:secret-value@127.0.0.2:1/nowhere");
    expect(code).toBe(1);
    expect(out).toMatch(/Cannot connect to PostgreSQL at 127\.0\.0\.2:1\/nowhere/);
    expect(out).not.toContain("secret-value"); // credentials are never printed
  });
});
