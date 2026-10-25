import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./db.js";
import { emailEnabled } from "./services/email.service.js";

const app = createApp();

const server = app.listen(env.SERVER_PORT, () => {
  console.log(`Skybreak Infra API listening on http://localhost:${env.SERVER_PORT} (${env.NODE_ENV})`);
  if (!emailEnabled()) console.log("Email delivery is disabled — enquiries are saved to the database only.");
});

async function shutdown(signal: string) {
  console.log(`${signal} received, shutting down…`);
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
