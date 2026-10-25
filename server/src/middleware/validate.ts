import type { RequestHandler } from "express";
import type { z } from "zod";

type Part = "body" | "query" | "params";

/**
 * Validates and replaces a request part with the parsed (coerced, stripped) value.
 * Express 5 exposes `req.query` as a getter, so parsed values are stored on `res.locals`.
 */
export function validate<S extends z.ZodType>(schema: S, part: Part = "body"): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) return next(result.error);
    if (part === "body") req.body = result.data;
    res.locals[part] = result.data;
    next();
  };
}
