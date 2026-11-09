import { strings } from "./strings";
import type { Recommendations } from "./types";
import { formatPrice, parseResult, safeUrl } from "./util";

export interface PlainTextOptions {
  lang?: string;
}

/**
 * Plain text for messaging bots (WhatsApp, Telegram, SMS): one line per card, each starting with the
 * label, then the disclosure sentence. Send the links exactly as given.
 *
 *   Sponsorlu · Kahve makinesi – ₺1.299,90 https://trk.adfacten.com/c/…
 */
export function toPlainText(input: Recommendations | null | undefined, options: PlainTextOptions = {}): string {
  const result = input ? parseResult(input) : null;
  if (!result) return "";
  const lang = options.lang || "tr";
  const label = result.disclosure.label.trim() || strings(lang).label;
  const lines = result.items.map((item) => {
    const price = formatPrice(item.price, lang);
    return `${label} · ${item.title}${price ? ` – ${price}` : ""} ${safeUrl(item.url)}`;
  });
  if (result.disclosure.text) lines.push(result.disclosure.text);
  return lines.join("\n");
}
