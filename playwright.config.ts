import { defineConfig, devices } from "@playwright/test";
import { e2eDatabaseUrl } from "./e2e/env";

/**
 * End-to-end tests run against an isolated stack:
 *   API  → http://localhost:4100 using the *_test database (reset + seeded in global setup)
 *   Web  → http://localhost:5180 (Vite dev server proxying to the test API)
 */
const API_PORT = 4100;
const WEB_PORT = 5180;

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // Headless Chromium renders WebGL in software. Layout/flow tests run with reduced motion
    // (a single static 3D frame); the full-motion 3D path has its own test in public.spec.ts.
    reducedMotion: "reduce",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "npm run dev -w server",
      url: `http://localhost:${API_PORT}/api/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        DATABASE_URL: e2eDatabaseUrl(),
        SERVER_PORT: String(API_PORT),
        CLIENT_URL: `http://localhost:${WEB_PORT}`,
        PUBLIC_SITE_URL: `http://localhost:${WEB_PORT}`,
        EMAIL_PROVIDER: "none",
        // Test addresses use the reserved example.test domain, which has no MX records.
        EMAIL_DOMAIN_CHECK: "false",
        UPLOAD_DIR: "uploads-test",
      },
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      cwd: "client",
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: { VITE_DEV_API_TARGET: `http://localhost:${API_PORT}`, VITE_PUBLIC_SITE_URL: `http://localhost:${WEB_PORT}` },
    },
  ],
});
