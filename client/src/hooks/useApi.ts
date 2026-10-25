import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import type { PageMeta } from "../types/api";

// Small in-memory cache so revisiting public pages renders instantly (stale-while-revalidate).
const cache = new Map<string, { data: unknown; meta?: PageMeta }>();

export function clearApiCache(prefix = "") {
  for (const key of cache.keys()) if (key.startsWith(prefix)) cache.delete(key);
}

interface State<T> {
  data: T | undefined;
  meta: PageMeta | undefined;
  error: ApiError | null;
  loading: boolean;
}

export function useApi<T>(path: string | null, { cacheable = true } = {}) {
  const cached = path && cacheable ? cache.get(path) : undefined;
  const [state, setState] = useState<State<T>>({
    data: cached?.data as T | undefined,
    meta: cached?.meta,
    error: null,
    loading: Boolean(path) && !cached,
  });
  const [nonce, setNonce] = useState(0);
  const [prevPath, setPrevPath] = useState(path);

  // Reset synchronously when the request key changes (derived-state pattern).
  if (prevPath !== path) {
    setPrevPath(path);
    const c = path && cacheable ? cache.get(path) : undefined;
    setState({ data: c?.data as T | undefined, meta: c?.meta, error: null, loading: Boolean(path) && !c });
  }

  useEffect(() => {
    if (!path) return;
    const ctrl = new AbortController();
    api
      .get<T>(path, ctrl.signal)
      .then((res) => {
        if (cacheable) cache.set(path, { data: res.data, meta: res.meta });
        setState({ data: res.data, meta: res.meta, error: null, loading: false });
      })
      .catch((err: unknown) => {
        if ((err as Error).name === "AbortError") return;
        const e = err instanceof ApiError ? err : new ApiError(0, "UNKNOWN", "Something went wrong");
        setState((s) => ({ ...s, error: e, loading: false }));
      });
    return () => ctrl.abort();
  }, [path, nonce, cacheable]);

  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    setNonce((n) => n + 1);
  }, []);

  return { ...state, reload };
}
