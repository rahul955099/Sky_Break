import { Prisma } from "../db.js";

/**
 * Error codes meaning "the database can't be reached or used right now" rather than a bug:
 * network-level codes surfaced by the pg driver adapter, and Prisma's connection error codes
 * (P1000 auth failed, P1001 unreachable, P1002 timeout, P1003 database missing,
 *  P1017 connection closed, P2024 connection-pool timeout).
 */
const UNAVAILABLE_CODES = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "ENOTFOUND",
  "EAI_AGAIN",
  "P1000",
  "P1001",
  "P1002",
  "P1003",
  "P1017",
  "P2024",
]);

/** Returns the failure code when `err` is a database-availability problem, otherwise null. */
export function databaseUnavailableCode(err: unknown): string | null {
  if (err instanceof Prisma.PrismaClientInitializationError) return err.errorCode ?? "INIT_FAILED";
  if (err instanceof Prisma.PrismaClientKnownRequestError && UNAVAILABLE_CODES.has(err.code)) return err.code;
  return null;
}

const HINTS: Record<string, string> = {
  ECONNREFUSED: "nothing is listening at the DATABASE_URL host/port — is PostgreSQL running? Locally: start Docker Desktop, then `npm run db:up`",
  ENOTFOUND: "the DATABASE_URL host name does not resolve — check DATABASE_URL",
  EAI_AGAIN: "DNS lookup for the database host failed — check network/DATABASE_URL",
  P1000: "authentication failed — check the user/password in DATABASE_URL",
  P1003: "the database named in DATABASE_URL does not exist — run `npm run db:deploy`",
  P2024: "timed out waiting for a free connection — consider raising DB_POOL_MAX",
};

export const databaseHint = (code: string) => HINTS[code] ?? "check that PostgreSQL is running and DATABASE_URL is correct";
