import { describe, expect, it } from "vitest";
import { stepped } from "../src/svg/stepped.js";

describe("stepped bands", () => {
  it("draws one closed outline per run, merging level steps", () => {
    // Columns 0-3 at y=10 and 4-7 at y=8, down to y=20; nothing from 8 on.
    const d = stepped("#123456", 100, 12, (x) => (x < 4 ? 10 : x < 8 ? 8 : undefined), () => 20);
    expect(d).toBe('<path fill="#123456" d="M100 10h4V8h4V20h-8z"/>');
  });

  it("splits into separate runs around gaps and styles CSS variables", () => {
    const d = stepped("var(--pf-ground)", 0, 12, (x) => (x % 8 < 4 ? 5 : undefined), () => 9);
    expect(d).toBe('<path style="fill:var(--pf-ground)" d="M0 5h4V9h-4zM8 5h4V9h-4z"/>');
  });

  it("draws nothing when the band is empty", () => {
    expect(stepped("#000", 0, 10, () => undefined, () => 0)).toBe("");
  });
});
