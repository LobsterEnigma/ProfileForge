import { XMLValidator } from "fast-xml-parser";
import { describe, expect, it } from "vitest";
import { demoState, MOODS } from "../src/demo.js";
import { terrainFor } from "../src/pet/scenery.js";
import { renderPetCard } from "../src/pet/render.js";
import { SPECIES } from "../src/pet/species/index.js";
import { SEASONS, SNOW } from "../src/world/seasons.js";
import { handleWidget } from "../src/handler.js";

const valid = (svg: string) => {
  expect(XMLValidator.validate(svg)).toBe(true);
  expect(svg).not.toMatch(/undefined|NaN/);
  return svg;
};

describe("scenery", () => {
  it("gives every species a home", () => {
    expect(terrainFor("crab")).toBe("beach");
    expect(terrainFor("gopher")).toBe("meadow");
    expect(terrainFor("snake")).toBe("jungle");
    expect(terrainFor("elephant")).toBe("savanna");
    expect(terrainFor("chick")).toBe("farm");
    expect(terrainFor("turtle")).toBe("pond");
    expect(terrainFor("dragon")).toBe("beach");
  });

  it("tints the ground everywhere but the beach", () => {
    expect(renderPetCard(demoState("idle", "adult", undefined, "crab"))).not.toContain('class="pf-tint"');
    expect(renderPetCard(demoState("idle", "adult", undefined, "gopher"))).toContain('class="pf-tint"');
  });

  for (const species of Object.keys(SPECIES)) {
    it(`renders ${species} in every season and mood`, () => {
      for (const season of SEASONS) for (const mood of MOODS) valid(renderPetCard(demoState(mood, "adult", undefined, species), { season }));
    });
  }
});

describe("the pet's weather matches its mood", () => {
  it("rains when the pet is hungry", () => {
    const svg = valid(renderPetCard(demoState("hungry")));
    expect(svg).toContain('class="pf-rain"');
    expect(svg).not.toContain('class="pf-star"');
  });

  it("gets foggy when the pet is asleep", () => {
    expect(valid(renderPetCard(demoState("sleeping")))).toContain('class="pf-fog"');
  });

  it("stays clear when the pet is happy", () => {
    const svg = valid(renderPetCard(demoState("happy")));
    expect(svg).not.toMatch(/class="pf-(rain|fog)"/);
    expect(svg).toContain('class="pf-star"');
  });
});

describe("the pet's season", () => {
  it("follows the date and drops autumn leaves", () => {
    expect(renderPetCard(demoState("happy"))).toMatch(/<path class="pf-fall pf-spin"/); // demo date is in September
  });

  it("snows on the ground in winter", () => {
    expect(renderPetCard(demoState("happy"), { season: "winter" })).toContain(SNOW);
  });

  it("flips with ?hemisphere=south", async () => {
    const res = await handleWidget("pet", new URL("http://localhost/api/pet?user=demo&hemisphere=south"));
    expect(await res.text()).toContain("#ffc8d6"); // spring petals instead of autumn leaves
  });
});
