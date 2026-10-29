/// <reference types="vitest/config" />
import { defineConfig, type ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const API = process.env.VITE_DEV_API_TARGET ?? "http://localhost:4000";

/**
 * Dev/preview proxy to the Express API. If the API process isn't running, answer with a clear
 * JSON 503 (the shape the app understands) instead of the proxy's anonymous HTTP 500.
 */
const toApi: ProxyOptions = {
  target: API,
  configure(proxy) {
    proxy.on("error", (err, _req, res) => {
      if (!res || !("writeHead" in res) || res.headersSent) return;
      const code = (err as NodeJS.ErrnoException).code ?? "PROXY_ERROR";
      res.writeHead(503, { "Content-Type": "application/json", "Retry-After": "5" });
      res.end(
        JSON.stringify({
          error: {
            code: "API_UNAVAILABLE",
            message: `The API server at ${API} is not running (${code}). Start it with "npm run dev" from the project root.`,
          },
        }),
      );
    });
  },
};
const apiProxy = { "/api": toApi, "/uploads": toApi, "/sitemap.xml": toApi, "/robots.txt": toApi };

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // The repository keeps one .env at the root; only VITE_* values reach the browser.
  envDir: "..",
  server: {
    port: 5173,
    proxy: apiProxy,
  },
  preview: {
    port: 4173,
    proxy: apiProxy,
  },
  build: {
    target: "es2022",
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
