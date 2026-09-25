import { XMLValidator } from "fast-xml-parser";
import { describe, expect, it } from "vitest";
import { demoState, MOODS, STAGES } from "../src/demo.js";
import { renderPetCard } from "../src/pet/render.js";
import { getSpecies, SPECIES, speciesForLanguage } from "../src/pet/species/index.js";
import type { Layer } from "../src/svg/pixel.js";
import { computePetState } from "../src/pet/state.js";
import { profile } from "./helpers.js";

describe("species", () => {
  it("follows your top language", () => {
    expect(speciesForLanguage("Go")).toBe("gopher");
    expect(speciesForLanguage("Python")).toBe("snake");
    expect(speciesForLanguage("PHP")).toBe("elephant");
    expect(speciesForLanguage("Rust")).toBe("crab");
    expect(speciesForLanguage("JavaScript")).toBe("chick");
    expect(speciesForLanguage("TypeScript")).toBe("turtle");
    expect(speciesForLanguage("COBOL")).toBe("crab");
    expect(speciesForLanguage(null)).toBe("crab");
  });

  it("can be pinned regardless of language", () => {
    const php = profile({ languages: [{ name: "PHP", color: "#4F5D95", bytes: 1 }] });
    expect(computePetState(php).species).toBe("elephant");
    expect(computePetState(php).petName).toBe("Ellie");
    expect(computePetState(php, { species: "crab" }).species).toBe("crab");
  });

  it("falls back to the crab for unknown ids", () => {
    expect(getSpecies("dragon").id).toBe("crab");
    expect(getSpecies("toString").id).toBe("crab"); // not fooled by Object.prototype
  });

  for (const species of Object.values(SPECIES)) {
    describe(species.id, () => {
      const layers: Layer[] = [
        ...species.body,
        ...Object.values(species.eyes).flat(),
        ...Object.values(species.mouths).flat(),
        ...species.blush,
        ...Object.values(species.limbs).flat(2),
      ];

      it("keeps every part inside its canvas", () => {
        for (const l of layers) {
          const width = Math.max(...l.grid.map((r) => r.length));
          expect(l.x).toBeGreaterThanOrEqual(0);
          expect(l.y).toBeGreaterThanOrEqual(0);
          expect(l.x + width).toBeLessThanOrEqual(species.width);
          expect(l.y + l.grid.length).toBeLessThanOrEqual(species.height);
        }
      });

      it("has a palette entry for every pixel", () => {
        const colors = { ...species.palette, ...species.legendaryPalette };
        for (const l of layers) for (const ch of l.grid.join("").replace(/[. ]/g, "")) expect(colors).toHaveProperty(ch);
      });

      for (const stage of STAGES) {
        it(`renders every mood as a ${stage}`, () => {
          for (const mood of MOODS) {
            const svg = renderPetCard(demoState(mood, stage, undefined, species.id));
            expect(XMLValidator.validate(svg)).toBe(true);
            expect(svg).not.toMatch(/undefined|NaN/);
          }
        });
      }
    });
  }
});
