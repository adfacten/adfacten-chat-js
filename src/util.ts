import type { Price, Recommendations } from "./types";

/** Only http(s) URLs ever reach an href or src. */
export function safeUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
  } catch {
    return null;
  }
}

const str = (v: unknown): v is string => typeof v === "string";

/** Keeps a response only if it has the shape we render; drops cards without a usable link. */
export function parseResult(data: unknown): Recommendations | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const disc = d.disclosure as Record<string, unknown> | undefined;
  if (!Array.isArray(d.items) || !disc || !str(disc.label) || !disc.label.trim()) return null;
  const items = d.items.filter((i): i is Recommendations["items"][number] => {
    const x = i as Record<string, unknown> | null;
    return !!x && str(x.id) && str(x.title) && safeUrl(x.url) !== null;
  });
  if (!items.length) return null;
  return {
    request_id: str(d.request_id) ? d.request_id : "",
    test: d.test === true,
    disclosure: { label: disc.label, text: str(disc.text) ? disc.text : "" },
    items,
  };
}

export function isEnglish(lang: string | undefined): boolean {
  return !!lang && !lang.toLowerCase().startsWith("tr");
}

export function pageLang(): string {
  return (typeof document !== "undefined" && document.documentElement.lang) || "tr";
}

export function formatPrice(price: Price | null | undefined, lang: string): string {
  if (!price) return "";
  const n = Number(price.amount);
  if (!Number.isFinite(n)) return "";
  try {
    return new Intl.NumberFormat(lang, { style: "currency", currency: price.currency }).format(n);
  } catch {
    return `${price.amount} ${price.currency}`;
  }
}

export function formatDate(iso: string, lang: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(lang, { dateStyle: "medium", timeStyle: "short" }).format(d);
  } catch {
    return d.toISOString();
  }
}
