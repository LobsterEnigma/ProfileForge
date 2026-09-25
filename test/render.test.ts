import { XMLValidator } from "fast-xml-parser";
import { describe, expect, it } from "vitest";
import { demoState, MOODS, STAGES } from "../src/demo.js";
import { renderPetCard } from "../src/pet/render.js";
import { renderErrorCard } from "../src/svg/error.js";
import { mirror, renderPixels } from "../src/svg/pixel.js";
import { THEME_NAMES } from "../src/themes.js";

describe("renderPixels", () => {
  it("merges horizontal runs into one path per color", () => {
    const svg = renderPixels([{ x: 0, y: 0, grid: ["aab", ".a."] }], { a: "#f00", b: "#00f" }, { scale: 2 });
    expect(svg).toBe(
      '<path fill="#f00" d="M0 0h4v2h-4zM2 2h2v2h-2z"/><path fill="#00f" d="M4 0h2v2h-2z"/>',
    );
  });

  it("puts CSS variables in style", () => {
    expect(renderPixels([{ x: 0, y: 0, grid: ["z"] }], { z: "var(--x)" }, { scale: 1 })).toContain('style="fill:var(--x)"');
  });

  it("rejects characters missing from the palette", () => {
    expect(() => renderPixels([{ x: 0, y: 0, grid: ["q"] }], {}, { scale: 1 })).toThrow(/"q"/);
  });

  it("mirrors grids", () => expect(mirror(["ab.", "c.."])).toEqual([".ba", "..c"]));
});

describe("renderPetCard", () => {
  for (const stage of STAGES) {
    for (const mood of MOODS) {
      for (const theme of THEME_NAMES) {
        it(`renders valid SVG: ${stage} / ${mood} / ${theme}`, () => {
          const svg = renderPetCard(demoState(mood, stage), { theme });
          expect(XMLValidator.validate(svg)).toBe(true);
          expect(svg).not.toMatch(/undefined|NaN/);
        });
      }
    }
  }

  it("escapes user-controlled text", () => {
    const svg = renderPetCard(demoState("happy", "adult", `<script>"x"</script>`));
    expect(XMLValidator.validate(svg)).toBe(true);
    expect(svg).not.toContain("<script>");
  });

  it("can hide the border", () => {
    const withBorder = renderPetCard(demoState());
    const without = renderPetCard(demoState(), { hideBorder: true });
    expect(without.length).toBeLessThan(withBorder.length);
  });

  it("stays small enough for GitHub's image proxy", () => {
    for (const stage of STAGES) {
      expect(renderPetCard(demoState("happy", stage)).length).toBeLessThan(40_000);
    }
  });
});

describe("renderErrorCard", () => {
  it("renders valid SVG", () => {
    expect(XMLValidator.validate(renderErrorCard("Oops & <stuff>", "hint"))).toBe(true);
  });
});
