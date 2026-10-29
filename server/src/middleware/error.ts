import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import multer from "multer";
import { Prisma } from "../db.js";
import { HttpError } from "../utils/http.js";
import { isProduction } from "../config/env.js";
import { databaseHint, databaseUnavailableCode } from "../utils/dbErrors.js";

// Log a database outage at most once per interval instead of a stack trace per request.
const DB_LOG_INTERVAL_MS = 30_000;
let lastDbLog = 0;

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: `No route for ${req.method} ${req.path}` } });
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(422).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Some fields are invalid. Please check and try again.",
        details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      },
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }

  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "File is too large" : err.message;
    return res.status(400).json({ error: { code: "UPLOAD_ERROR", message } });
  }

  const dbCode = databaseUnavailableCode(err);
  if (dbCode) {
    if (Date.now() - lastDbLog > DB_LOG_INTERVAL_MS) {
      lastDbLog = Date.now();
      console.error(`[db] Database unavailable (${dbCode}) on ${req.method} ${req.path}: ${databaseHint(dbCode)}`);
    }
    // 503 (temporary) rather than 500 (bug): clients and proxies may retry.
    return res
      .status(503)
      .set("Retry-After", "30")
      .json({ error: { code: "DATABASE_UNAVAILABLE", message: "Our service is temporarily unavailable. Please try again in a moment." } });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: { code: "CONFLICT", message: "A record with this value already exists" } });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Record not found" } });
    }
  }

  // body-parser errors
  if (typeof err === "object" && err && "type" in err) {
    if (err.type === "entity.too.large") {
      return res.status(413).json({ error: { code: "PAYLOAD_TOO_LARGE", message: "Request body is too large" } });
    }
    if (err.type === "entity.parse.failed") {
      return res.status(400).json({ error: { code: "BAD_JSON", message: "Malformed JSON body" } });
    }
  }

  // Log only the essentials — never request bodies, cookies or headers.
  console.error(`[error] ${req.method} ${req.path}:`, isProduction ? (err as Error)?.message : err);
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again later." } });
};
