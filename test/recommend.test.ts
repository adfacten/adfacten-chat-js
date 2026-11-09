import { describe, expect, it, vi } from "vitest";
import { recommend } from "../src/recommend";
import { result } from "./fixtures";

const json = (status: number, body: unknown) => new Response(body === null ? null : JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("recommend", () => {
  it("posts the request with the public key and maps options", async () => {
    const f = vi.fn(async () => json(200, result()));
    const r = await recommend({ key: "rpk_x", placement: "plc_1", query: "  kahve makinesi  ", priceMax: 2500, limit: 2, agentCheckout: true, fetch: f, endpoint: "https://api.test/" });
    expect(r?.items).toHaveLength(2);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.test/v1/recommendations");
    expect((init.headers as Record<string, string>)["X-Adfacten-Key"]).toBe("rpk_x");
    expect(init.credentials).toBe("omit");
    expect(JSON.parse(init.body as string)).toEqual({ placement: "plc_1", query: "kahve makinesi", price_max: 2500, limit: 2, agent_checkout: true });
  });

  it("trims long queries to 500 characters", async () => {
    const f = vi.fn(async () => json(204, null));
    await recommend({ key: "k", placement: "p", query: "a".repeat(900), fetch: f });
    const init = (f.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(JSON.parse(init.body as string).query).toHaveLength(500);
  });

  it("returns null on 204", async () => {
    expect(await recommend({ key: "k", placement: "p", query: "q", fetch: async () => new Response(null, { status: 204 }) })).toBeNull();
  });

  it("reports API problems and returns null", async () => {
    const onError = vi.fn();
    const r = await recommend({ key: "k", placement: "p", query: "q", onError, fetch: async () => json(401, { code: "unknown_key", detail: "Bilinmeyen anahtar" }) });
    expect(r).toBeNull();
    expect(onError).toHaveBeenCalledWith({ status: 401, code: "unknown_key", message: "Bilinmeyen anahtar" });
  });

  it("gives up after the timeout", async () => {
    const onError = vi.fn();
    const slow = (_: unknown, init?: RequestInit) => new Promise<Response>((_res, rej) => {
      init?.signal?.addEventListener("abort", () => rej(new DOMException("aborted", "AbortError")));
    });
    const r = await recommend({ key: "k", placement: "p", query: "q", timeout: 20, onError, fetch: slow as typeof fetch });
    expect(r).toBeNull();
    expect(onError.mock.calls[0]?.[0].code).toBe("timeout");
  });

  it("never throws on network errors", async () => {
    const r = await recommend({ key: "k", placement: "p", query: "q", fetch: async () => { throw new TypeError("offline"); } });
    expect(r).toBeNull();
  });

  it("rejects malformed responses and unsafe links", async () => {
    const onError = vi.fn();
    const bad = result({ items: [{ id: "x", title: "t", merchant: "m", url: "javascript:alert(1)" }] });
    expect(await recommend({ key: "k", placement: "p", query: "q", onError, fetch: async () => json(200, bad) })).toBeNull();
    expect(onError.mock.calls[0]?.[0].code).toBe("invalid_response");
    expect(await recommend({ key: "k", placement: "p", query: "q", fetch: async () => json(200, { items: [] }) })).toBeNull();
  });

  it("does not call the API without a query", async () => {
    const f = vi.fn();
    expect(await recommend({ key: "k", placement: "p", query: "  ", fetch: f })).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });
});
