import type { CookieOptions, RequestHandler } from "express";
import { isProduction, env } from "../config/env.js";
import { createSession, destroySession, SESSION_COOKIE, verifyCredentials } from "../services/auth.service.js";
import { HttpError, ok } from "../utils/http.js";

const cookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict",
  path: "/",
  maxAge: env.SESSION_TTL_HOURS * 3600_000,
});

export const login: RequestHandler = async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  const user = await verifyCredentials(email, password);
  if (!user) throw new HttpError(401, "INVALID_CREDENTIALS", "Incorrect email or password");

  // Replace any existing session from this browser (session fixation defence).
  const previous: unknown = req.cookies?.[SESSION_COOKIE];
  if (typeof previous === "string") await destroySession(previous);

  const session = await createSession(user.id, req.get("user-agent"));
  res.cookie(SESSION_COOKIE, session.token, cookieOptions());
  ok(res, { user, csrfToken: session.csrfToken, expiresAt: session.expiresAt });
};

export const logout: RequestHandler = async (req, res) => {
  const token: unknown = req.cookies?.[SESSION_COOKIE];
  if (typeof token === "string") await destroySession(token);
  const { maxAge: _m, ...clear } = cookieOptions();
  res.clearCookie(SESSION_COOKIE, clear);
  res.status(204).end();
};

export const me: RequestHandler = (req, res) => {
  ok(res, { user: req.user, csrfToken: req.csrfToken });
};
