import { rateLimit } from "express-rate-limit";
import { env } from "../config/env.js";

const message = (text: string) => ({ error: { code: "RATE_LIMITED", message: text } });
const skip = () => env.NODE_ENV === "test" && process.env.ENABLE_RATE_LIMIT_IN_TESTS !== "true";

export const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip,
  message: message("Too many requests. Please slow down."),
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip,
  message: message("Too many sign-in attempts. Please wait 15 minutes and try again."),
});

export const enquiryLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip,
  message: message("You've sent several enquiries recently. Please wait a little before sending another."),
});
