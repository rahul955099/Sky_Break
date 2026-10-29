import type { PageMeta } from "../types/api";

export interface FieldIssue {
  path: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: FieldIssue[],
    /** Non-field error data, e.g. { retryAfter } for rate-limited actions. */
    public extra?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// The CSRF token lives in memory only; it is re-fetched from /api/auth/me after a reload.
let csrfToken: string | null = null;
export const setCsrfToken = (token: string | null) => {
  csrfToken = token;
};

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * API location. Default "/api" (same origin): used in local development (Vite proxy) and in
 * production behind the Netlify → backend proxy, which keeps the SameSite=Strict session cookie
 * first-party. Set VITE_API_URL (e.g. https://api.example.com/api) only for a cross-origin API.
 */
const RAW_BASE = (import.meta.env.VITE_API_URL ?? "").trim().replace(/\/$/, "");
export const API_BASE = RAW_BASE || "/api";
/** Origin of a cross-origin API, or "" when the API is served from the site's own origin. */
export const API_ORIGIN = (() => {
  if (!/^https?:\/\//i.test(API_BASE) || typeof window === "undefined") return "";
  const origin = new URL(API_BASE).origin;
  return origin === window.location.origin ? "" : origin;
})();

export const apiUrl = (path: string) => `${API_BASE}${path}`;

// Generous enough for a sleeping free-tier backend to wake; uploads get longer.
const TIMEOUT_MS = 25_000;
const UPLOAD_TIMEOUT_MS = 90_000;

async function request<T>(method: Method, path: string, body?: unknown, signal?: AbortSignal) {
  const headers: Record<string, string> = { Accept: "application/json" };
  const isForm = body instanceof FormData;
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";
  if (method !== "GET" && csrfToken) headers["X-CSRF-Token"] = csrfToken;

  // Combine the caller's abort signal (component unmount) with a timeout.
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, isForm ? UPLOAD_TIMEOUT_MS : TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort, { once: true });

  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      method,
      headers,
      credentials: API_ORIGIN ? "include" : "same-origin",
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (timedOut) throw new ApiError(0, "TIMEOUT", "The server is taking too long to respond. Please try again in a moment.");
    if ((err as Error).name === "AbortError") throw err;
    throw new ApiError(0, "NETWORK_ERROR", "We couldn't reach the server. Please check your connection and try again.");
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }

  if (res.status === 204) return { data: undefined as T, meta: undefined };
  const isJson = (res.headers.get("content-type") ?? "").includes("application/json");
  const json = isJson ? await res.json().catch(() => null) : null;
  if (!isJson || json === null) {
    // Typically an HTML page from a static host or proxy instead of the API (misconfigured
    // API URL/proxy, backend down, or a 502/504 from the proxy).
    throw new ApiError(res.status, "BAD_RESPONSE", res.ok ? "The service returned an unexpected response. Please try again later." : `The service is unavailable right now (${res.status}). Please try again shortly.`);
  }
  if (!res.ok) {
    const e = json.error;
    const details = Array.isArray(e?.details) ? (e.details as FieldIssue[]) : undefined;
    const extra = e?.details && !Array.isArray(e.details) && typeof e.details === "object" ? (e.details as Record<string, unknown>) : undefined;
    throw new ApiError(res.status, e?.code ?? "HTTP_ERROR", e?.message ?? `Request failed (${res.status})`, details, extra);
  }
  return json as { data: T; meta?: PageMeta };
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>("GET", path, undefined, signal),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T = void>(path: string) => request<T>("DELETE", path),
};

export function qs(params: Record<string, string | number | undefined | null>) {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") s.set(k, String(v));
  const str = s.toString();
  return str ? `?${str}` : "";
}
