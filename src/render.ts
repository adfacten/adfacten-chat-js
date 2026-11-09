import { CSS } from "./styles";
import { strings } from "./strings";
import type { Item, Recommendations, RenderHandle, RenderOptions } from "./types";
import { formatDate, formatPrice, pageLang, parseResult, safeUrl } from "./util";

const VISIBLE_RATIO = 0.5;
const VISIBLE_MS = 1000;

// Beacons already sent in this page, so a re-render of the same result never counts twice.
const sent = new Set<string>();
const mounted = new WeakMap<Element, RenderHandle>();

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

export function sendBeacon(url: string): void {
  if (sent.has(url)) return;
  sent.add(url);
  try {
    if (typeof fetch === "function") {
      void fetch(url, { method: "GET", mode: "no-cors", credentials: "omit", keepalive: true, cache: "no-store" }).catch(() => undefined);
      return;
    }
  } catch { /* fall through */ }
  new Image().src = url;
}

/**
 * Renders the cards into `container` (replacing an earlier render there). The label stays on top of the
 * cards: if anything removes or changes it, it is put back. Each card's view is reported once, after it
 * has been at least half visible for one second.
 */
export function render(container: Element, input: Recommendations | null | undefined, options: RenderOptions = {}): RenderHandle {
  mounted.get(container)?.destroy();
  const result = input ? parseResult(input) : null;
  const noop: RenderHandle = { destroy() {} };
  if (!result) return noop;

  const lang = options.lang || pageLang();
  const s = strings(lang);
  const labelText = result.disclosure.label.trim() || s.label;

  const host = el("div");
  host.setAttribute("data-adfacten", "chat");
  host.setAttribute("data-theme", options.theme || "auto");
  const root = host.attachShadow({ mode: "open" });
  const style = el("style");
  style.textContent = CSS;

  const aside = el("aside", "r");
  aside.setAttribute("aria-label", s.region);
  aside.lang = lang;

  const buildHeader = () => {
    const h = el("div", "h");
    const label = el("span", "l", labelText);
    label.setAttribute("data-adf-label", "");
    h.append(label);
    if (result.disclosure.text) h.append(el("span", "", result.disclosure.text));
    if (result.test) h.append(el("span", "t", s.test));
    return h;
  };
  let header = buildHeader();

  const list = el("ul");
  list.setAttribute("role", "list");
  const cards = new Map<Element, Item>();
  for (const item of result.items) {
    const href = safeUrl(item.url);
    if (!href) continue;
    const li = el("li");
    const a = el("a");
    a.href = href;
    a.target = "_blank";
    a.rel = "sponsored noopener";
    a.referrerPolicy = "no-referrer-when-downgrade";
    if (options.onClick) a.addEventListener("click", () => options.onClick?.(item));

    const img = safeUrl(item.image_url);
    if (img) {
      const i = el("img", "i");
      i.src = img;
      i.alt = "";
      i.loading = "lazy";
      i.decoding = "async";
      i.referrerPolicy = "no-referrer";
      i.addEventListener("error", () => i.replaceWith(el("span", "ph")), { once: true });
      a.append(i);
    } else {
      a.append(el("span", "ph"));
    }

    const body = el("span", "b");
    const title = el("span", "n", item.title);
    title.dir = "auto";
    body.append(title);
    const meta = [item.brand, item.merchant].filter((x, i, arr) => x && arr.indexOf(x) === i).join(" · ");
    if (meta) {
      const m = el("span", "m", meta);
      m.dir = "auto";
      body.append(m);
    }
    const price = formatPrice(item.price, lang);
    if (price) {
      const p = el("span", "p", price);
      const when = item.price ? formatDate(item.price.as_of, lang) : "";
      if (when) {
        const note = s.asOf.replace("{d}", when);
        p.title = note;
        p.append(el("span", "s", ` (${note})`));
      }
      body.append(p);
    }
    if (item.why) {
      const w = el("span", "w", item.why);
      w.dir = "auto";
      body.append(w);
    }
    body.append(el("span", "s", ` (${s.newTab})`));
    a.append(body);
    li.append(a);
    list.append(li);
    if (item.shown_url && safeUrl(item.shown_url)) cards.set(li, item);
  }

  aside.append(header, list);
  root.append(style, aside);
  container.append(host);

  // Keep the label in place.
  const labelOk = () => {
    const l = header.firstElementChild;
    return header.parentNode === aside && aside.firstElementChild === header && !!l && l.hasAttribute("data-adf-label")
      && l.className === "l" && l.textContent === labelText && !l.getAttribute("style") && !l.hasAttribute("hidden")
      && !header.getAttribute("style") && !header.hasAttribute("hidden") && style.parentNode === root && style.textContent === CSS;
  };
  const guard = typeof MutationObserver === "function" ? new MutationObserver(() => {
    if (labelOk()) return;
    header.remove();
    header = buildHeader();
    aside.prepend(header);
    if (style.parentNode !== root || style.textContent !== CSS) { style.textContent = CSS; root.prepend(style); }
  }) : null;
  guard?.observe(root, { childList: true, subtree: true, attributes: true, characterData: true });

  // Viewability: half the card on screen for one second, page visible.
  const timers = new Map<Element, ReturnType<typeof setTimeout>>();
  const inView = new Set<Element>();
  const arm = (card: Element) => {
    if (timers.has(card) || document.visibilityState === "hidden") return;
    timers.set(card, setTimeout(() => {
      timers.delete(card);
      const item = cards.get(card);
      if (!item?.shown_url || document.visibilityState === "hidden") return;
      sendBeacon(item.shown_url);
      cards.delete(card);
      io?.unobserve(card);
      inView.delete(card);
    }, VISIBLE_MS));
  };
  const disarm = (card: Element) => {
    const t = timers.get(card);
    if (t !== undefined) clearTimeout(t);
    timers.delete(card);
  };
  const io = typeof IntersectionObserver === "function" && cards.size ? new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting && e.intersectionRatio >= VISIBLE_RATIO) { inView.add(e.target); arm(e.target); }
      else { inView.delete(e.target); disarm(e.target); }
    }
  }, { threshold: [0, VISIBLE_RATIO, 1] }) : null;
  for (const card of cards.keys()) io?.observe(card);
  const onVisibility = () => {
    if (document.visibilityState === "hidden") for (const c of [...timers.keys()]) disarm(c);
    else for (const c of inView) arm(c);
  };
  document.addEventListener("visibilitychange", onVisibility);

  const handle: RenderHandle = {
    destroy() {
      guard?.disconnect();
      io?.disconnect();
      for (const c of [...timers.keys()]) disarm(c);
      document.removeEventListener("visibilitychange", onVisibility);
      host.remove();
      if (mounted.get(container) === handle) mounted.delete(container);
    },
  };
  mounted.set(container, handle);
  return handle;
}
