import { z } from "zod";

const boolish = z
  .enum(["true", "false", "1", "0", ""])
  .optional()
  .transform((v) => v === "true" || v === "1");

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined));

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    SERVER_PORT: z.coerce.number().int().positive().default(4000),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
    SESSION_TTL_HOURS: z.coerce.number().positive().max(24 * 30).default(8),
    CLIENT_URL: z.string().default("http://localhost:5173"),
    PUBLIC_SITE_URL: z.url().default("http://localhost:5173"),
    TRUST_PROXY: boolish,
    SERVE_CLIENT: boolish,
    EMAIL_PROVIDER: z.enum(["none", "smtp"]).default("none"),
    SMTP_HOST: optionalString,
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_SECURE: boolish,
    SMTP_USER: optionalString,
    SMTP_PASS: optionalString,
    EMAIL_FROM: optionalString,
    ENQUIRY_NOTIFY_TO: optionalString,
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
export const siteUrl = env.PUBLIC_SITE_URL.replace(/\/$/, "");
