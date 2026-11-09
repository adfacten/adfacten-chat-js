import type { Recommendations } from "../src/types";

export const result = (over: Partial<Recommendations> = {}): Recommendations => ({
  request_id: "rec_1",
  test: false,
  disclosure: { label: "Sponsorlu", text: "Bu öneriler reklamdır." },
  items: [
    {
      id: "prd_1", title: "Filtre kahve makinesi", brand: "Kahvem", merchant: "Mağaza A",
      price: { amount: "1299.90", currency: "TRY", as_of: "2026-11-09T08:00:00Z" },
      image_url: "https://cdn.example/1.jpg", url: "https://trk.adfacten.com/c/abc?s1=plc_1",
      shown_url: "https://trk.adfacten.com/i?imp=a&e=rec_shown", why: "Sorunuzla ilgili: kahve makinesi",
    },
    {
      id: "prd_2", title: "Öğütücü", merchant: "Mağaza B", price: null, image_url: null,
      url: "https://trk.adfacten.com/c/def", shown_url: "https://trk.adfacten.com/i?imp=b&e=rec_shown",
    },
  ],
  ...over,
});
