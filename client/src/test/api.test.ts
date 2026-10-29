import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiError, API_BASE, API_ORIGIN, apiUrl } from "../lib/api";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("api client", () => {
  it("defaults to the same-origin /api base (Vite proxy locally, Netlify proxy in production)", () => {
    expect(API_BASE).toBe("/api");
    expect(API_ORIGIN).toBe("");
    expect(apiUrl("/services")).toBe("/api/services");
  });

  it("sends same-origin credentials and parses the JSON envelope", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: [1, 2] }), { headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const res = await api.get<number[]>("/services");
    expect(res.data).toEqual([1, 2]);
    expect(fetchMock).toHaveBeenCalledWith("/api/services", expect.objectContaining({ credentials: "same-origin" }));
  });

  it("reports an HTML page served instead of the API (misconfigured host/proxy) as an error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<!doctype html><html></html>", { status: 200, headers: { "Content-Type": "text/html" } })));
    const err = await api.get("/services").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).code).toBe("BAD_RESPONSE");
  });

  it("reports proxy/gateway failures with the status code", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("Bad gateway", { status: 502, headers: { "Content-Type": "text/plain" } })));
    const err = (await api.get("/services").catch((e: unknown) => e)) as ApiError;
    expect(err.status).toBe(502);
    expect(err.message).toMatch(/unavailable/i);
  });

  it("times out instead of loading forever", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init: RequestInit) => new Promise((_res, reject) => init.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError"))))),
    );
    const pending = api.get("/services").catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(25_001);
    const err = (await pending) as ApiError;
    expect(err.code).toBe("TIMEOUT");
  });
});
