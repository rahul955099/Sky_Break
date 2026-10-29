/**
 * Client copy of the server's contact rules (server/src/utils/contact.ts) for instant
 * feedback. The server re-validates and normalises everything.
 */
export function normalizeIndianMobile(input: string): string | null {
  const compact = input.replace(/[\s().-]/g, "");
  const m = /^(?:\+91|0091|91|0)?([6-9]\d{9})$/.exec(compact);
  return m ? `+91${m[1]}` : null;
}

export function isImplausibleMobile(e164: string): boolean {
  const d = e164.slice(-10);
  if (/^(\d)\1{9}$/.test(d)) return true;
  const steps = new Set<number>();
  for (let i = 1; i < d.length; i++) steps.add((Number(d[i]) - Number(d[i - 1]) + 10) % 10);
  return steps.size === 1 && (steps.has(1) || steps.has(9));
}

export const MOBILE_ERROR = "Enter a valid Indian mobile number: 10 digits starting with 6, 7, 8 or 9";
