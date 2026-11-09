import type { RecommendError, RecommendOptions, Recommendations } from "./types";
import { parseResult } from "./util";

export const DEFAULT_ENDPOINT = "https://api.adfacten.com";
export const DEFAULT_TIMEOUT = 400;
export const MAX_QUERY = 500;

/**
 * Asks for sponsored product cards. Never throws: resolves to null when nothing fits, the topic is
 * not eligible, the request fails or the timeout passes. Fire it in parallel with your model call.
 */
export async function recommend(opts: RecommendOptions): Promise<Recommendations | null> {
  const fail = (status: number, code: string, message: string): null => {
    opts.onError?.({ status, code, message } satisfies RecommendError);
    return null;
  };
  const query = (opts.query || "").trim().slice(0, MAX_QUERY);
  if (!query || !opts.key || !opts.placement) return fail(0, "invalid_request", "key, placement and query are required");

  const doFetch = opts.fetch ?? (typeof fetch === "function" ? fetch : undefined);
  if (!doFetch) return fail(0, "network", "fetch is not available");

  const ctrl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; ctrl.abort(); }, opts.timeout ?? DEFAULT_TIMEOUT);
  const onAbort = () => ctrl.abort();
  opts.signal?.addEventListener("abort", onAbort);

  const body: Record<string, unknown> = { placement: opts.placement, query };
  if (opts.lang) body.lang = opts.lang;
  if (opts.country) body.country = opts.country;
  if (opts.currency) body.currency = opts.currency;
  if (opts.priceMax != null) body.price_max = opts.priceMax;
  if (opts.limit != null) body.limit = opts.limit;
  if (opts.session) body.session = opts.session;
  if (opts.agentCheckout) body.agent_checkout = true;
  if (opts.test) body.test = true;

  try {
    const res = await doFetch(`${(opts.endpoint || DEFAULT_ENDPOINT).replace(/\/+$/, "")}/v1/recommendations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Adfacten-Key": opts.key },
      body: JSON.stringify(body),
      credentials: "omit",
      signal: ctrl.signal,
    });
    if (res.status === 204) return null;
    if (!res.ok) {
      let code = "http_error";
      let message = `HTTP ${res.status}`;
      try {
        const p = (await res.json()) as { code?: string; type?: string; title?: string; detail?: string };
        code = p.code || (p.type ? p.type.split("/").pop() || code : code);
        message = p.detail || p.title || message;
      } catch { /* not JSON */ }
      return fail(res.status, code, message);
    }
    const parsed = parseResult(await res.json());
    return parsed ?? fail(res.status, "invalid_response", "unexpected response");
  } catch (e) {
    if (timedOut) return fail(0, "timeout", "request timed out");
    if (opts.signal?.aborted) return null;
    return fail(0, "network", e instanceof Error ? e.message : "network error");
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener("abort", onAbort);
  }
}
