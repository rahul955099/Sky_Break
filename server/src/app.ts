import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { corsOrigins, env, siteUrl } from "./config/env.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { publicRouter } from "./routes/public.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { seoRouter } from "./routes/seo.routes.js";
import { uploadDir } from "./services/upload.service.js";
import { HttpError } from "./utils/http.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(here, "../../client/dist");

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  if (env.TRUST_PROXY) app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "img-src": ["'self'", "data:", "blob:", "https://images.unsplash.com"],
          "font-src": ["'self'", "https://fonts.gstatic.com"],
          "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          "script-src": ["'self'"],
          "connect-src": ["'self'"],
          "frame-ancestors": ["'none'"],
          // Only force HTTPS sub-resources when the site is actually served over HTTPS.
          "upgrade-insecure-requests": siteUrl.startsWith("https://") ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
      // Allows the Vite dev origin to display /uploads images.
      crossOriginResourcePolicy: { policy: env.NODE_ENV === "production" ? "same-origin" : "cross-origin" },
    }),
  );

  app.use(
    cors({
      origin(origin, cb) {
        // Same-origin and non-browser requests have no Origin header.
        if (!origin || corsOrigins.includes(origin)) return cb(null, true);
        cb(new HttpError(403, "CORS_REJECTED", "Origin not allowed"));
      },
      credentials: true,
      allowedHeaders: ["Content-Type", "X-CSRF-Token"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      maxAge: 600,
    }),
  );

  app.use(express.json({ limit: "200kb" }));
  app.use(cookieParser());

  app.use("/api", apiLimiter);
  app.use("/api", publicRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api", notFoundHandler);

  app.use(seoRouter);
  app.use(
    "/uploads",
    express.static(uploadDir, {
      maxAge: "30d",
      immutable: true,
      fallthrough: false,
      setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff"),
    }),
  );

  // Optional single-server deployment: serve the built SPA with history-API fallback.
  if (env.SERVE_CLIENT && fs.existsSync(clientDist)) {
    app.use(express.static(clientDist, { index: false, maxAge: "1h" }));
    app.use("/assets", express.static(path.join(clientDist, "assets"), { immutable: true, maxAge: "1y" }));
    app.get(/^(?!\/api\/|\/uploads\/).*/, (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
  }

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
