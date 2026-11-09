import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "../src/render";
import { result } from "./fixtures";

type Cb = (entries: Partial<IntersectionObserverEntry>[]) => void;
let observers: { cb: Cb; targets: Element[] }[] = [];

class FakeIO {
  targets: Element[] = [];
  constructor(cb: Cb) { observers.push({ cb, targets: this.targets }); }
  observe(t: Element) { this.targets.push(t); }
  unobserve(t: Element) { this.targets.splice(this.targets.indexOf(t), 1); }
  disconnect() { this.targets.length = 0; }
}

const see = (target: Element, ratio: number) =>
  observers.forEach((o) => o.targets.includes(target) && o.cb([{ target, isIntersecting: ratio > 0, intersectionRatio: ratio }]));
const shadow = (c: Element) => (c.querySelector("[data-adfacten]") as HTMLElement).shadowRoot!;
const flush = () => new Promise((r) => setTimeout(r, 0));

let fetchSpy: ReturnType<typeof vi.fn>;
beforeEach(() => {
  observers = [];
  vi.stubGlobal("IntersectionObserver", FakeIO);
  fetchSpy = vi.fn(async () => new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchSpy);
  document.body.innerHTML = "";
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("render", () => {
  it("renders the label first, the cards and safe links", () => {
    const c = document.body.appendChild(document.createElement("div"));
    render(c, result(), { lang: "tr" });
    const root = shadow(c);
    const label = root.querySelector(".h > .l")!;
    expect(label.textContent).toBe("Sponsorlu");
    expect(root.querySelector("aside")?.getAttribute("aria-label")).toBe("Sponsorlu öneriler");
    const links = root.querySelectorAll("a");
    expect(links).toHaveLength(2);
    expect(links[0]!.rel).toBe("sponsored noopener");
    expect(links[0]!.target).toBe("_blank");
    expect(links[0]!.textContent).toContain("Filtre kahve makinesi");
    expect(links[0]!.textContent).toContain("Sorunuzla ilgili");
    expect(root.querySelector(".p")?.getAttribute("title")).toMatch(/itibarıyla/);
    expect(root.querySelector(".t")).toBeNull();
  });

  it("shows the test badge and English strings", () => {
    const c = document.body.appendChild(document.createElement("div"));
    render(c, result({ test: true, disclosure: { label: "Sponsored", text: "" } }), { lang: "en", theme: "dark" });
    expect(c.querySelector("[data-adfacten]")?.getAttribute("data-theme")).toBe("dark");
    expect(shadow(c).querySelector(".t")?.textContent).toMatch(/TEST/);
    expect(shadow(c).querySelector("aside")?.getAttribute("aria-label")).toBe("Sponsored recommendations");
  });

  it("treats API text as text, never HTML", () => {
    const c = document.body.appendChild(document.createElement("div"));
    const r = result();
    r.items[0]!.title = "<img src=x onerror=alert(1)>";
    render(c, r);
    expect(shadow(c).querySelector(".n")?.textContent).toBe("<img src=x onerror=alert(1)>");
    expect(shadow(c).querySelectorAll("img.i")).toHaveLength(1);
  });

  it("puts the label back when it is removed or hidden", async () => {
    const c = document.body.appendChild(document.createElement("div"));
    render(c, result());
    const root = shadow(c);
    root.querySelector(".h")!.remove();
    await flush();
    expect(root.querySelector("aside")!.firstElementChild?.querySelector(".l")?.textContent).toBe("Sponsorlu");
    (root.querySelector(".l") as HTMLElement).style.display = "none";
    await flush();
    expect((root.querySelector(".l") as HTMLElement).getAttribute("style")).toBeNull();
    root.querySelector(".l")!.textContent = "";
    await flush();
    expect(root.querySelector(".l")?.textContent).toBe("Sponsorlu");
  });

  it("reports a card once after it was half visible for one second", () => {
    vi.useFakeTimers();
    const c = document.body.appendChild(document.createElement("div"));
    render(c, result());
    const [card1, card2] = [...shadow(c).querySelectorAll("li")];
    see(card1!, 0.6);
    vi.advanceTimersByTime(999);
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]![0]).toBe("https://trk.adfacten.com/i?imp=a&e=rec_shown");
    see(card1!, 0.9);
    vi.advanceTimersByTime(2000);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    see(card2!, 0.4);
    vi.advanceTimersByTime(2000);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    see(card2!, 0.6);
    vi.advanceTimersByTime(500);
    see(card2!, 0);
    vi.advanceTimersByTime(1000);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("does not count views while the page is hidden", () => {
    vi.useFakeTimers();
    const c = document.body.appendChild(document.createElement("div"));
    render(c, result({ request_id: "rec_hidden", items: [{ ...result().items[0]!, shown_url: "https://trk.adfacten.com/i?imp=h&e=rec_shown" }] }));
    const vis = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    see(shadow(c).querySelector("li")!, 1);
    vi.advanceTimersByTime(3000);
    expect(fetchSpy).not.toHaveBeenCalled();
    vis.mockReturnValue("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    vi.advanceTimersByTime(1000);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("replaces an earlier render and cleans up on destroy", () => {
    const c = document.body.appendChild(document.createElement("div"));
    render(c, result());
    const h = render(c, result());
    expect(c.querySelectorAll("[data-adfacten]")).toHaveLength(1);
    h.destroy();
    expect(c.querySelectorAll("[data-adfacten]")).toHaveLength(0);
  });

  it("renders nothing for an empty result", () => {
    const c = document.body.appendChild(document.createElement("div"));
    render(c, null);
    render(c, result({ items: [] }));
    expect(c.children).toHaveLength(0);
  });

  it("calls onClick", () => {
    const onClick = vi.fn();
    const c = document.body.appendChild(document.createElement("div"));
    render(c, result(), { onClick });
    const a = shadow(c).querySelector("a")!;
    a.addEventListener("click", (e) => e.preventDefault());
    a.click();
    expect(onClick.mock.calls[0]![0].id).toBe("prd_1");
  });
});
