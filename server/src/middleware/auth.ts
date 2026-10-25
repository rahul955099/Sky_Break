import type { RequestHandler } from "express";
import type { AdminRole } from "../db.js";
import { findSession, SESSION_COOKIE, type SessionUser } from "../services/auth.service.js";
import { forbidden, HttpError, unauthorized } from "../utils/http.js";
import { safeEqual } from "../utils/security.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: SessionUser;
    sessionId?: string;
    csrfToken?: string;
  }
}

/** Loads the session from the httpOnly cookie and rejects the request when absent or expired. */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token: unknown = req.cookies?.[SESSION_COOKIE];
  if (typeof token !== "string" || token.length < 20) return next(unauthorized());

  const session = await findSession(token);
  if (!session) return next(unauthorized("Your session has expired. Please sign in again."));

  const { id, email, name, role } = session.user;
  req.user = { id, email, name, role };
  req.sessionId = session.id;
  req.csrfToken = session.csrfToken;
  next();
};

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Synchroniser-token CSRF protection: state-changing requests must echo the per-session token
 * (returned by /api/auth/login and /api/auth/me) in the X-CSRF-Token header.
 */
export const requireCsrf: RequestHandler = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();
  const header = req.get("x-csrf-token");
  if (!header || !req.csrfToken || !safeEqual(header, req.csrfToken)) {
    return next(new HttpError(403, "CSRF_INVALID", "Security token missing or invalid. Please refresh and try again."));
  }
  next();
};

const RANK: Record<AdminRole, number> = { EDITOR: 1, ADMIN: 2, OWNER: 3 };

/** Allows the request when the user's role is at least `minimum`. */
export const requireRole =
  (minimum: AdminRole): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    if (RANK[req.user.role] < RANK[minimum]) return next(forbidden());
    next();
  };
