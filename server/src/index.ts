import { createApp } from "./app.js";
import { corsOrigins, env, listenPort } from "./config/env.js";
import { prisma } from "./db.js";
import { emailEnabled } from "./services/email.service.js";
import { databaseHint, databaseUnavailableCode } from "./utils/dbErrors.js";

process.on("unhandledRejection", (reason) => {
  console.error("[fatal] Unhandled promise rejection:", reason instanceof Error ? reason.message : reason);
});

const app = createApp();

const server = app.listen(listenPort, env.HOST, () => {
  console.log(`Skybreak Infra API listening on http://${env.HOST}:${listenPort} (${env.NODE_ENV})`);
  console.log(`CORS origins: ${corsOrigins.join(", ") || "(none)"} · cookies SameSite=${env.COOKIE_SAMESITE} · trust proxy=${String(env.TRUST_PROXY)}`);
  if (!emailEnabled()) console.log("Email delivery is disabled — enquiries are saved to the database only.");
  // Report database reachability at boot without exiting: /api/health keeps reporting it.
  prisma
    .$queryRaw`SELECT 1`
    .then(() => console.log("Database connection OK."))
    .catch((err: unknown) => {
      const code = databaseUnavailableCode(err) ?? (err as { code?: string })?.code ?? "UNKNOWN";
      console.error(`[startup] Database unreachable (${code}): ${databaseHint(code)}. API requests that need the database will return 503 until it is available.`);
    });
});

server.on("error", (err: NodeJS.ErrnoException) => {
  console.error(
    err.code === "EADDRINUSE" ? `[startup] Port ${listenPort} is already in use.` : `[startup] Server failed to start: ${err.message}`,
  );
  process.exit(1);
});

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received, finishing in-flight requests…`);
  // Hosts send SIGTERM before replacing an instance; give requests up to 10 s to complete.
  const force = setTimeout(() => process.exit(1), 10_000);
  force.unref();
  server.close(async () => {
    await prisma.$disconnect().catch(() => {});
    process.exit(0);
  });
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
