/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const API = process.env.VITE_DEV_API_TARGET ?? "http://localhost:4000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // The repository keeps one .env at the root; only VITE_* values reach the browser.
  envDir: "..",
  server: {
    port: 5173,
    proxy: {
      "/api": API,
      "/uploads": API,
      "/sitemap.xml": API,
      "/robots.txt": API,
    },
  },
  preview: {
    port: 4173,
    proxy: { "/api": API, "/uploads": API, "/sitemap.xml": API, "/robots.txt": API },
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
