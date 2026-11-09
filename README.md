# @adfacten/chat

Sponsored product cards for AI chat apps, assistants and bots, from the Adfacten network.

Send the user's question, get up to three related products from advertisers' catalogs, and show them under
your assistant's answer with a mandatory “Sponsored” label. You earn a commission when a card leads to a
sale. Views and clicks are never charged or paid.

- No dependencies, under 8 KB gzipped.
- Never throws, never blocks your answer: 400 ms timeout by default, `null` when there is nothing to show.
- Accessible, themeable cards in a shadow root, so your page styles and ours never clash.
- Counts a view only after half of a card has been on screen for one second, once.
- Optional React component. Plain-text helper for WhatsApp, Telegram and other messaging bots.

Full guide: <https://developers.adfacten.com/ai-recommendations-en>

## Install

From the CDN:

```html
<script src="https://cdn.adfacten.com/js/chat-1.0.0.js"></script>
<!-- exposes window.AdfactenChat -->
```

From npm:

```bash
npm install @adfacten/chat
```

You need an assistant's public key (`rpk_…`) and a placement ID (`plc_…`) from the Adfacten panel
(**AI assistants**). New assistants are in test mode and get sample cards that record nothing.

## Usage

```html
<div id="adfacten-cards"></div>
<script>
  // Fire it together with your model call.
  AdfactenChat.recommend({ key: "rpk_…", placement: "plc_…", query: userMessage })
    .then((result) => AdfactenChat.render(document.getElementById("adfacten-cards"), result));
</script>
```

```ts
import { recommend, render } from "@adfacten/chat";

const result = await recommend({ key: "rpk_…", placement: "plc_…", query: userMessage, lang: "en" });
render(document.getElementById("adfacten-cards")!, result, { theme: "auto" });
```

### `recommend(options)`

Resolves to `{ request_id, test, disclosure, items }` or `null` (nothing relevant, a sensitive topic, an
error or a timeout).

| Option | Default | |
|---|---|---|
| `key` | | Public key `rpk_…` (required) |
| `placement` | | Placement ID `plc_…` (required) |
| `query` | | The user's message or shopping intent, trimmed to 500 characters (required) |
| `lang` | `tr` | `tr` or `en` |
| `country`, `currency` | | E.g. `TR`, `TRY` |
| `priceMax` | | Upper price limit |
| `limit` | placement maximum | 1–3 |
| `session` | | Opaque conversation ID (hashed on our side) |
| `agentCheckout` | `false` | Ask for an `attribution_token` per card |
| `test` | `false` | Force test cards |
| `timeout` | `400` | Milliseconds |
| `endpoint` | `https://api.adfacten.com` | |
| `signal` | | `AbortSignal` |
| `onError` | | `(error) => void`, with `status`, `code` and `message` |
| `fetch` | global `fetch` | Custom fetch |

### `render(container, result, options?)`

Draws the cards inside `container` and returns `{ destroy() }`. Rendering `null` removes earlier cards and draws
nothing; rendering again into the same container replaces the previous cards.

| Option | Default | |
|---|---|---|
| `theme` | `auto` | `light`, `dark` or `auto` (follows the system) |
| `lang` | page language | Language of the built-in strings |
| `onClick` | | `(item) => void`, called when a card is clicked |

The label is always on top. If it is removed, hidden or changed, it is put back. Links open in a new tab
with `rel="sponsored noopener"`.

Colors can be tuned on the container with CSS custom properties:

```css
#adfacten-cards {
  --adf-bg: #fff; --adf-fg: #111; --adf-muted: #666; --adf-border: #e5e5e5;
  --adf-accent: #a100a1; --adf-hover: #f6f6f6; --adf-radius: 12px; --adf-font: Inter, sans-serif;
}
```

### `toPlainText(result, { lang })`

For messaging bots:

```
Sponsored · Filter coffee machine – ₺1,299.90 https://trk.adfacten.com/c/…
These are ads; if you buy, Adfacten and the publisher earn a commission.
```

Send the links unchanged and call each card's `shown_url` once when the message is delivered.

### React

```tsx
import { AdfactenRecommendations } from "@adfacten/chat/react";

<AdfactenRecommendations request={{ key: "rpk_…", placement: "plc_…", query: userMessage }} theme="auto" />;
// or, with cards you fetched on your server:
<AdfactenRecommendations result={cards} />;
```

`react` is an optional peer dependency (17 or later).

## Rules

- Always show the label and the disclosure sentence next to the cards.
- Keep cards separate from the model's answer; do not present them as the model's own advice.
- No cards in services directed at children.
- Open card links unchanged and only on a user click.

## Development

```bash
npm install
npm test        # vitest + jsdom
npm run build   # dist/: ESM, CJS, UMD (chat-<version>.js) and type declarations; fails above 8 KB gzipped
```

## License

Apache-2.0
