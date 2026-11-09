import { describe, expect, it } from "vitest";
import { toPlainText } from "../src/text";
import { result } from "./fixtures";

describe("toPlainText", () => {
  it("prefixes every line with the label and ends with the disclosure", () => {
    const lines = toPlainText(result()).split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toMatch(/^Sponsorlu · Filtre kahve makinesi – .*1\.299,90.* https:\/\/trk\.adfacten\.com\/c\/abc\?s1=plc_1$/);
    expect(lines[1]).toBe("Sponsorlu · Öğütücü https://trk.adfacten.com/c/def");
    expect(lines[2]).toBe("Bu öneriler reklamdır.");
  });

  it("returns an empty string without cards", () => {
    expect(toPlainText(null)).toBe("");
    expect(toPlainText(result({ items: [] }))).toBe("");
  });
});
