import { promises as dns } from "node:dns";

/**
 * Indian mobile numbers: 10 digits starting with 6–9, optionally prefixed with
 * +91, 0091, 91 or a trunk 0. Spaces, dashes, dots and brackets are ignored.
 * Returns the E.164 form (+91XXXXXXXXXX) or null when the input is not an Indian mobile.
 */
export function normalizeIndianMobile(input: string): string | null {
  const compact = input.replace(/[\s().-]/g, "");
  const m = /^(?:\+91|0091|91|0)?([6-9]\d{9})$/.exec(compact);
  return m ? `+91${m[1]}` : null;
}

/** Rejects obviously fake numbers such as 9999999999 or 9876543210. */
export function isImplausibleMobile(e164: string): boolean {
  const d = e164.slice(-10);
  if (/^(\d)\1{9}$/.test(d)) return true;
  const steps = new Set<number>();
  for (let i = 1; i < d.length; i++) steps.add((Number(d[i]) - Number(d[i - 1]) + 10) % 10);
  // A single repeated step of +1 or -1 means a straight run like 6789012345 / 9876543210.
  return steps.size === 1 && (steps.has(1) || steps.has(9));
}

export const MOBILE_ERROR = "Enter a valid Indian mobile number: 10 digits starting with 6, 7, 8 or 9";

// ── Email domain deliverability ─────────────────────────────────

const cache = new Map<string, { ok: boolean; at: number }>();
const CACHE_MS = 60 * 60_000;
const LOOKUP_TIMEOUT_MS = 3000;

const withTimeout = <T>(p: Promise<T>) =>
  Promise.race([p, new Promise<never>((_, reject) => setTimeout(() => reject(Object.assign(new Error("timeout"), { code: "ETIMEOUT" })), LOOKUP_TIMEOUT_MS))]);

const isNoRecord = (err: unknown) => ["ENOTFOUND", "ENODATA", "NXDOMAIN"].includes((err as NodeJS.ErrnoException)?.code ?? "");

/**
 * True when the email's domain can receive mail (MX record, or an address record as the
 * RFC 5321 fallback). Fails open — returns true — on timeouts or resolver errors, so a DNS
 * outage never blocks a genuine customer. Only definite "no such domain / no mail" answers
 * return false.
 */
export interface MailResolver {
  resolveMx(domain: string): Promise<{ exchange: string; priority: number }[]>;
  resolve4(domain: string): Promise<unknown[]>;
  resolve6(domain: string): Promise<unknown[]>;
}

export async function emailDomainAcceptsMail(email: string, resolver: MailResolver = dns): Promise<boolean> {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  const hit = cache.get(domain);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.ok;

  let ok = true;
  let definite = true;
  try {
    const mx = await withTimeout(resolver.resolveMx(domain));
    // A "null MX" (single record with exchange ".") explicitly declares that the domain takes no mail.
    ok = mx.some((r) => r.exchange && r.exchange !== ".");
  } catch (err) {
    if (isNoRecord(err)) {
      try {
        const a = await withTimeout(resolver.resolve4(domain).catch(() => resolver.resolve6(domain)));
        ok = a.length > 0;
      } catch (err2) {
        ok = !isNoRecord(err2);
        definite = isNoRecord(err2);
      }
    } else {
      // Timeout, SERVFAIL, network error: fail open and don't cache the guess.
      definite = false;
    }
  }
  if (definite) cache.set(domain, { ok, at: Date.now() });
  return ok;
}
