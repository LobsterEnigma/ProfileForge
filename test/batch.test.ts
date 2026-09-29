import { describe, expect, it } from "vitest";
import { pathData, RectBatch } from "../src/svg/batch.js";

describe("rect batches", () => {
  it("moves relative to the rect before when that's shorter", () => {
    expect(pathData([[110, 120, 2, 4], [114, 120, 2, 4], [110, 126, 3, 1]])).toBe("M110 120h2v4h-2zm4 0h2v4h-2zm-4 6h3v1h-3z");
    // Jumping back across the scene is shorter written out in full.
    expect(pathData([[300, 20, 1, 1], [2, 22, 1, 1]])).toBe("M300 20h1v1h-1zM2 22h1v1h-1z");
  });

  it("groups by fill and styles CSS variables", () => {
    const svg = new RectBatch().add("#fff", 0, 0, 1, 1).add("var(--x)", 5, 5, 1, 1).add("#fff", 2, 0, 1, 1).toString();
    expect(svg).toBe('<path fill="#fff" d="M0 0h1v1h-1zM2 0h1v1h-1z"/><path style="fill:var(--x)" d="M5 5h1v1h-1z"/>');
  });

  it("keeps fractional positions tidy", () => {
    expect(pathData([[10.1, 0, 1, 1], [10.3, 0, 1, 1]])).toBe("M10.1 0h1v1h-1zm0.2 0h1v1h-1z");
  });
});

describe("line batches", () => {
  it("draws each rect as a vertical stroke of its width, grouped by colour and width", async () => {
    const { LineBatch } = await import("../src/svg/batch.js");
    const svg = new LineBatch().add("var(--w)", 10, 20, 2, 3).add("var(--w)", 14, 20, 2, 3).add("#fff", 0, 0, 1, 4).toString();
    expect(svg).toBe('<path style="stroke:var(--w)" stroke-width="2" d="M11 20v3m4 -3v3"/><path stroke="#fff" stroke-width="1" d="M0.5 0v4"/>');
  });
});
