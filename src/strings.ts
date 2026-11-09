import { isEnglish } from "./util";

const TR = {
  label: "Sponsorlu",
  region: "Sponsorlu öneriler",
  asOf: "Fiyat {d} itibarıyla",
  newTab: "sponsorlu bağlantı, yeni sekmede açılır",
  test: "TEST · kayıt tutulmaz",
};
const EN: typeof TR = {
  label: "Sponsored",
  region: "Sponsored recommendations",
  asOf: "Price as of {d}",
  newTab: "sponsored link, opens in a new tab",
  test: "TEST · nothing is recorded",
};

export type Strings = typeof TR;
export const strings = (lang: string | undefined): Strings => (isEnglish(lang) ? EN : TR);
