import { z } from "zod";

const boolish = z
  .enum(["true", "false", "1", "0", ""])
  .optional()
  .transform((v) => v === "true" || v === "1");

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined));

/**
 * Express "trust proxy": "false" (default), "true", or a hop count. Use a hop count in
 * production — e.g. 2 behind Netlify's proxy + the host's load balancer — so rate limiting
 * keys on the real client IP without trusting arbitrary X-Forwarded-For chains.
 */
const trustProxy = z
  .string()
  .optional()
  .transform((v, ctx): boolean | number => {
    const raw = (v ?? "").trim().toLowerCase();
    if (raw === "" || raw === "false" || raw === "0") return false;
    if (raw === "true") return true;
    const n = Number(raw);
    if (Number.isInteger(n) && n > 0 && n < 10) return n;
    ctx.addIssue({ code: "custom", message: 'Use "false", "true" or a hop count such as 2' });
    return z.NEVER;
  });

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    // Hosting platforms (Render, Railway, Fly…) inject PORT; SERVER_PORT is the local setting.
    PORT: z.coerce.number().int().positive().optional(),
    SERVER_PORT: z.coerce.number().int().positive().default(4000),
    HOST: z.string().default("0.0.0.0"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    /** Maximum PostgreSQL connections held by this server process. */
    DB_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
    SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
    SESSION_TTL_HOURS: z.coerce.number().positive().max(24 * 30).default(8),
    CLIENT_URL: z.string().default("http://localhost:5173"),
    PUBLIC_SITE_URL: z.url().default("http://localhost:5173"),
    TRUST_PROXY: trustProxy,
    /**
     * Session cookie SameSite. "strict" is correct when the browser talks to the API on the
     * site's own origin (Netlify proxy, or SERVE_CLIENT). "none" is only for a cross-site API
     * domain and requires HTTPS; browsers that block third-party cookies will still reject it.
     */
    COOKIE_SAMESITE: z.enum(["strict", "lax", "none"]).default("strict"),
    SERVE_CLIENT: boolish,
    EMAIL_PROVIDER: z.enum(["none", "smtp"]).default("none"),
    SMTP_HOST: optionalString,
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_SECURE: boolish,
    SMTP_USER: optionalString,
    SMTP_PASS: optionalString,
    EMAIL_FROM: optionalString,
    ENQUIRY_NOTIFY_TO: optionalString,
    /** Reject enquiry emails whose domain cannot receive mail (DNS MX lookup; fails open). */
    EMAIL_DOMAIN_CHECK: z
      .enum(["true", "false"])
      .default("true")
      .transform((v) => v === "true"),
    UPLOAD_DIR: z.string().default("uploads"),
    MAX_UPLOAD_MB: z.coerce.number().positive().max(25).default(5),
  })
  .superRefine((env, ctx) => {
    if (env.EMAIL_PROVIDER === "smtp") {
      for (const key of ["SMTP_HOST", "EMAIL_FROM", "ENQUIRY_NOTIFY_TO"] as const) {
        if (!env[key]) {
          ctx.addIssue({ code: "custom", path: [key], message: `${key} is required when EMAIL_PROVIDER=smtp` });
        }
      }
    }
    if (env.COOKIE_SAMESITE === "none" && env.NODE_ENV !== "production") {
      ctx.addIssue({ code: "custom", path: ["COOKIE_SAMESITE"], message: 'SameSite "none" needs Secure cookies — only valid with NODE_ENV=production over HTTPS' });
    }
    if (env.NODE_ENV === "production" && /replace-with/i.test(env.SESSION_SECRET)) {
      ctx.addIssue({ code: "custom", path: ["SESSION_SECRET"], message: "Set a real SESSION_SECRET in production" });
    }
  });

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`).join("\n");
    // Fail fast with a readable message; values are never printed.
    throw new Error(`Invalid environment configuration:\n${problems}\nSee .env.example for reference.`);
  }
  return parsed.data;
}

export const env = loadEnv();

export const corsOrigins = env.CLIENT_URL.split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

export const isProduction = env.NODE_ENV === "production";
export const listenPort = env.PORT ?? env.SERVER_PORT;
export const siteUrl = env.PUBLIC_SITE_URL.replace(/\/$/, "");
