import crypto from "node:crypto";
import { prisma, type Prisma } from "../db.js";
import { env, isProduction } from "../config/env.js";
import { HttpError } from "../utils/http.js";
import { safeEqual } from "../utils/security.js";
import { emailEnabled, sendVerificationCodeEmail } from "./email.service.js";
import { getSettings } from "./settings.service.js";

const PURPOSE = "ENQUIRY";
export const CODE_TTL_SECONDS = 10 * 60;
export const RESEND_COOLDOWN_SECONDS = 60;
const MAX_CODES_PER_HOUR = 5;
const MAX_ATTEMPTS = 5;

const hashCode = (email: string, code: string) =>
  crypto.createHmac("sha256", env.SESSION_SECRET).update(`${PURPOSE}:${email}:${code}`).digest("hex");

const codeError = (message: string) =>
  new HttpError(422, "VALIDATION_ERROR", message, [{ path: "emailCode", message }]);

/**
 * Issues a 6-digit code for verifying an enquiry email address.
 * Only an HMAC of the code is stored. Without SMTP:
 *  - development/test: the code is logged and returned as `devCode` so the flow can be tested;
 *  - production: the request is refused, and the customer is asked to use a mobile number.
 */
export async function issueEnquiryCode(email: string, ipHash: string | null) {
  if (!emailEnabled() && isProduction) {
    throw new HttpError(
      503,
      "EMAIL_UNAVAILABLE",
      "Email verification is temporarily unavailable. Please enter an Indian mobile number instead.",
    );
  }

  const now = Date.now();
  const recent = await prisma.emailVerification.findMany({
    where: { email, purpose: PURPOSE, createdAt: { gte: new Date(now - 3600_000) } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  const last = recent[0];
  if (last) {
    const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - (now - last.createdAt.getTime()) / 1000);
    if (wait > 0) {
      throw new HttpError(429, "CODE_COOLDOWN", `Please wait ${wait} seconds before requesting another code.`, { retryAfter: wait });
    }
  }
  if (recent.length >= MAX_CODES_PER_HOUR) {
    throw new HttpError(429, "CODE_LIMIT", "Too many codes have been requested for this email. Please try again in an hour.");
  }

  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  await prisma.$transaction([
    // Only the newest code is valid.
    prisma.emailVerification.updateMany({ where: { email, purpose: PURPOSE, consumedAt: null }, data: { consumedAt: new Date() } }),
    prisma.emailVerification.create({
      data: { email, purpose: PURPOSE, codeHash: hashCode(email, code), expiresAt: new Date(now + CODE_TTL_SECONDS * 1000), ipHash },
    }),
  ]);

  let devCode: string | undefined;
  if (emailEnabled()) {
    const { companyName } = await getSettings();
    const sent = await sendVerificationCodeEmail(email, code, companyName);
    if (!sent) {
      throw new HttpError(502, "EMAIL_SEND_FAILED", "We couldn't send the code right now. Please try again or use your mobile number.");
    }
  } else {
    devCode = code;
    console.log(`[dev] Email delivery disabled — verification code for ${email}: ${code}`);
  }
  return { expiresInSeconds: CODE_TTL_SECONDS, resendAfterSeconds: RESEND_COOLDOWN_SECONDS, devCode };
}

/**
 * Checks the code against the newest unused code for the email. Wrong attempts are counted
 * immediately (outside any enquiry transaction) so they persist even though the submission fails.
 * Returns the verification id, to be consumed atomically with the enquiry.
 */
export async function checkEnquiryCode(email: string, code: string): Promise<string> {
  const rec = await prisma.emailVerification.findFirst({
    where: { email, purpose: PURPOSE, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!rec) throw codeError("Please request a verification code for this email first.");
  if (rec.expiresAt.getTime() < Date.now()) throw codeError("This code has expired. Please request a new one.");
  if (rec.attempts >= MAX_ATTEMPTS) throw codeError("Too many incorrect attempts. Please request a new code.");
  if (!safeEqual(hashCode(email, code), rec.codeHash)) {
    await prisma.emailVerification.update({ where: { id: rec.id }, data: { attempts: { increment: 1 } } });
    const left = MAX_ATTEMPTS - rec.attempts - 1;
    throw codeError(left > 0 ? `That code isn't correct. ${left} attempt${left === 1 ? "" : "s"} left.` : "Too many incorrect attempts. Please request a new code.");
  }
  return rec.id;
}

/** Marks the code used inside the enquiry transaction; fails if it was used concurrently. */
export async function consumeEnquiryCode(tx: Prisma.TransactionClient, id: string) {
  const { count } = await tx.emailVerification.updateMany({ where: { id, consumedAt: null }, data: { consumedAt: new Date() } });
  if (count !== 1) throw codeError("This code has already been used. Please request a new one.");
}
