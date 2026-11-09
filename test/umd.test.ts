import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const file = resolve(process.cwd(), "dist/chat-1.0.0.js");

describe.skipIf(!existsSync(file))("UMD bundle", () => {
  it("exposes window.AdfactenChat", () => {
    const w = window as unknown as { AdfactenChat?: Record<string, unknown> };
    new Function(readFileSync(file, "utf8")).call(window);
    expect(typeof w.AdfactenChat?.recommend).toBe("function");
    expect(typeof w.AdfactenChat?.render).toBe("function");
    expect(typeof w.AdfactenChat?.toPlainText).toBe("function");
    expect(w.AdfactenChat?.VERSION).toBe("1.0.0");
  });
});
