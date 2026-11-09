/** A product price taken from the merchant's feed. `amount` is a decimal string, `as_of` an ISO timestamp. */
export interface Price {
  amount: string;
  currency: string;
  as_of: string;
}

/** One sponsored product card. */
export interface Item {
  id: string;
  title: string;
  brand?: string | null;
  merchant: string;
  price?: Price | null;
  image_url?: string | null;
  /** Tracked link. Always open it as is: it records the click and redirects to the merchant. */
  url: string;
  /** Fired once when the card has really been seen (render() does this for you). */
  shown_url?: string | null;
  /** Why this card was picked, for the reader. */
  why?: string | null;
  /** Only with `agentCheckout: true`: pass it to the merchant's checkout so the sale is attributed. */
  attribution_token?: string | null;
  expires_at?: string | null;
}

/** The mandatory disclosure. Show `label` next to the cards. */
export interface Disclosure {
  label: string;
  text: string;
}

export interface Recommendations {
  request_id: string;
  /** Test cards: demo products, nothing is recorded or paid. */
  test: boolean;
  disclosure: Disclosure;
  items: Item[];
}

export interface RecommendOptions {
  /** The assistant's public key (`rpk_…`). Safe to ship in browsers. */
  key: string;
  /** Placement ID (`plc_…`). */
  placement: string;
  /** The user's latest message or the extracted shopping intent. Trimmed to 500 characters. */
  query: string;
  lang?: string;
  country?: string;
  currency?: string;
  /** Upper price limit in `currency`. */
  priceMax?: number;
  /** 1–3 cards. */
  limit?: number;
  /** Optional opaque conversation id; it is hashed on our side and never stored as is. */
  session?: string;
  /** Ask for an attribution token per card (for agents that complete the purchase themselves). */
  agentCheckout?: boolean;
  /** Return test cards even for an approved assistant. */
  test?: boolean;
  /** Give up after this many milliseconds and return null. Default 400. */
  timeout?: number;
  /** API base URL. Default https://api.adfacten.com */
  endpoint?: string;
  signal?: AbortSignal;
  /** Called when the request fails (bad key, rate limit, network). recommend() still resolves to null. */
  onError?: (error: RecommendError) => void;
  /** Custom fetch, for tests or server runtimes. */
  fetch?: typeof fetch;
}

export interface RecommendError {
  /** HTTP status, or 0 for network errors and timeouts. */
  status: number;
  /** Problem code from the API (`unknown_key`, `rate_limited`, …), `timeout`, `network` or `invalid_response`. */
  code: string;
  message: string;
}

export type Theme = "light" | "dark" | "auto";

export interface RenderOptions {
  /** Default "auto": follows the user's system setting. */
  theme?: Theme;
  /** UI language for the few built-in strings. Defaults to the page language. */
  lang?: string;
  /** Called after a card is clicked (the link still opens normally). */
  onClick?: (item: Item) => void;
}

export interface RenderHandle {
  /** Stops observers and removes the cards. */
  destroy(): void;
}
