import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdfactenRecommendations } from "../src/react";
import { result } from "./fixtures";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
afterEach(() => { document.body.innerHTML = ""; });

describe("AdfactenRecommendations", () => {
  it("renders a given result", async () => {
    const el = document.body.appendChild(document.createElement("div"));
    const root = createRoot(el);
    await act(async () => root.render(createElement(AdfactenRecommendations, { result: result() })));
    const host = el.querySelector("[data-adfacten]") as HTMLElement;
    expect(host.shadowRoot?.querySelectorAll("a")).toHaveLength(2);
    await act(async () => root.unmount());
  });

  it("fetches when given a request", async () => {
    const f = vi.fn(async () => new Response(JSON.stringify(result()), { status: 200 }));
    const onResult = vi.fn();
    const el = document.body.appendChild(document.createElement("div"));
    const root = createRoot(el);
    await act(async () => root.render(createElement(AdfactenRecommendations, { request: { key: "rpk_x", placement: "plc_1", query: "kahve", fetch: f }, onResult })));
    expect(f).toHaveBeenCalledTimes(1);
    expect(onResult.mock.calls[0]![0].items).toHaveLength(2);
    expect(el.querySelector("[data-adfacten]")).not.toBeNull();
    await act(async () => root.unmount());
  });
});
