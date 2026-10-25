import crypto from "node:crypto";
import { env } from "../config/env.js";

export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString("base64url");

export const sha256 = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

/** Keyed hash so stored IP fingerprints cannot be reversed with a lookup table. */
export const hashIp = (ip: string | undefined) =>
  ip ? crypto.createHmac("sha256", env.SESSION_SECRET).update(ip).digest("hex").slice(0, 32) : null;

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
